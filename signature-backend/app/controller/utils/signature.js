import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import libre from "libreoffice-convert";
import ImageModule from "docxtemplater-image-module-free";
import QRCode from "qrcode";
import Court from "../../models/courts.js";
import * as signatureServices from "../../services/signature.js";
import { roles, status, signStatus } from "../../constants/index.js";
import * as templateServices from "../../services/templates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Convert DOCX to PDF using LibreOffice
const convertToPDF = (docxBuf) => {
    return new Promise((resolve, reject) => {
        libre.convert(docxBuf, '.pdf', undefined, (err, pdfBuf) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(pdfBuf);
        });
    });
};

// utils/Sign Validatetion
export const validateRequest = async (req) => {
  const { id } = req.params;
  const { userId, courtId, role } = req.session;
  const { signatureId } = req.body;

  if (!userId) throw new Error("User not assigned", 403);
  if (!signatureId) throw new Error("SignatureId is required", 400);

  const court = await Court.findOne({ id: courtId });
  if (!court) throw new Error("Court not found", 400);

  const query = { id, status: status.active };
  if (role === roles.reader) query.signStatus = signStatus.delegated;

  const request = await templateServices.findOne(query);
  if (!request)
    throw new Error("Request not found or not assigned to you", 404);
  if (!request.url)
    throw new Error("No template file associated with this request", 400);

  const signature = await signatureServices.findOne({
    id: signatureId,
    userId,
  });
  if (!signature) throw new Error("Signature not found or access denied", 404);

  return { courtName: court.name, request, signature };
};

// utils/Sign DocumentProcessing
export const processDocument = async (
  document,
  docxPath,
  signedDir,
  qrCodeDir,
  courtName,
  signaturePath,
  io,
  id,
  totalNonRejected
) => {
  if (document.signStatus === signStatus.rejected) return document;

  const content = await fs.promises.readFile(docxPath, "binary");
  const zip = new PizZip(content);

  const imageModule = new ImageModule({
    centered: false,
    getImage: (tagValue) => {
      if (!tagValue || typeof tagValue !== "string") {
        throw new Error(`Invalid tagValue: ${tagValue}`);
      }
      let normalizedPath = tagValue.replace(/\\/g, "/");
      if (normalizedPath.startsWith("/")) {
        normalizedPath = normalizedPath.slice(1);
      }

      // Try the path as-is (relative to project root)
      let imagePath = path.resolve(__dirname, "../../", normalizedPath);
      if (fs.existsSync(imagePath)) {
        return fs.readFileSync(imagePath);
      }

      // Try filename in Uploads/signatures
      const fileName = path.basename(normalizedPath);
      const altPath = path.resolve(__dirname, "../../Uploads/signatures", fileName);
      if (fs.existsSync(altPath)) {
        return fs.readFileSync(altPath);
      }

      // Try filename in Uploads/qrcodes/<id>
      const qrPath = path.resolve(__dirname, "../../Uploads/qrcodes", id, fileName);
      if (fs.existsSync(qrPath)) {
        return fs.readFileSync(qrPath);
      }

      // Try tagValue directly in Uploads/signatures
      const directSignaturePath = path.resolve(__dirname, "../../Uploads/signatures", tagValue);
      if (fs.existsSync(directSignaturePath)) {
        return fs.readFileSync(directSignaturePath);
      }

      throw new Error(
        `Image file not found at ${imagePath}, ${altPath}, ${qrPath}, or ${directSignaturePath}`
      );
    },
    getSize: (tagValue) => {
      return typeof tagValue === "string" && tagValue.includes("qrcode")
        ? [250, 250]
        : [150, 100];
    },
    parser: (tag) => {
      const isValid = tag === "Signature" || tag === "qrCode";
      if (!isValid) {
        console.warn(`Invalid or unexpected tag in template: ${tag}`);
      }
      return isValid;
    },
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule],
  });

  const data =
    document.data instanceof Map
      ? Object.fromEntries(document.data)
      : document.data || {};
  data["Signature"] = signaturePath.replace(/\\/g, "/"); // Fixed: Removed redundant path.join
  data["Court"] = courtName;

  const documentId = document.id.toString();
  const qrCodeUrl = `${process.env.FRONTEND_URL}/document/${documentId}`;
  const qrCodeFileName = `${documentId}_qrcode.png`;
  const qrCodePath = path.join(qrCodeDir, qrCodeFileName);
  await QRCode.toFile(qrCodePath, qrCodeUrl, { width: 100, margin: 1 });
  data["qrCode"] = qrCodePath.replace(/\\/g, "/");

  try {
    doc.render(data);
  } catch (error) {
    console.error('Docxtemplater render error:', error);
    throw error;
  }

  const filledDocxBuf = doc
    .getZip()
    .generate({ type: "nodebuffer", compression: "DEFLATE" });
  const pdfBuf = await convertToPDF(filledDocxBuf);

  const signedPdfPath = path.join(signedDir, `${document.id}_signed.pdf`);
  await fs.promises.writeFile(signedPdfPath, pdfBuf);

  return {
    ...document,
    signedPath: signedPdfPath,
    signStatus: signStatus.Signed,
    signedDate: new Date(),
    qrCodePath,
  };
};
