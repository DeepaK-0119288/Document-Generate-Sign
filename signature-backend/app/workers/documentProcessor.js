import { Worker } from 'bullmq';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import QRCode from 'qrcode';
import libre from 'libreoffice-convert';
import * as templateServices from '../services/templates.js';
import { signStatus } from '../constants/index.js';

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

const worker = new Worker(
    'document-processing',
    async (job) => {
        const { documentId, requestId, docxPath, signaturePath, courtName, data, userId, frontendUrl } = job.data;

        try {
            // Create request-specific signed directory
            const signedDir = path.resolve(__dirname, '../Uploads/signed', requestId);
            if (!fs.existsSync(signedDir)) {
                fs.mkdirSync(signedDir, { recursive: true });
            }

            // Temporary directory for QR codes
            const qrCodeDir = path.resolve(__dirname, '../Uploads/qrcodes', requestId);
            if (!fs.existsSync(qrCodeDir)) {
                fs.mkdirSync(qrCodeDir, { recursive: true });
            }

            // Validate docx file
            if (!fs.existsSync(docxPath)) {
                throw new Error('Template file not found');
            }

            // Read and process DOCX
            const content = fs.readFileSync(docxPath, 'binary');
            const zip = new PizZip(content);

            const imageModule = new ImageModule({
                centered: false,
                getImage: function (tagValue) {
                    let normalizedPath = tagValue.replace(/\\/g, '/');
                    if (normalizedPath.startsWith('/')) {
                        normalizedPath = normalizedPath.slice(1);
                    }
                    let imagePath = path.resolve(__dirname, '../', normalizedPath);
                    if (!fs.existsSync(imagePath)) {
                        const fileName = path.basename(normalizedPath);
                        const altPath = path.resolve(__dirname, '../Uploads/signatures', fileName);
                        if (fs.existsSync(altPath)) {
                            return fs.readFileSync(altPath);
                        }
                        const qrPath = path.resolve(__dirname, '../Uploads/qrcodes', requestId, fileName);
                        if (fs.existsSync(qrPath)) {
                            return fs.readFileSync(qrPath);
                        }
                        throw new Error(`Image file not found at ${imagePath}, ${altPath}, or ${qrPath}`);
                    }
                    return fs.readFileSync(imagePath);
                },
                getSize: function (tagValue) {
                    if (tagValue.includes('qrcode')) {
                        return [250, 250];
                    }
                    return [150, 100];
                },
                parser: function (tag) {
                    return tag === 'Signature' || tag === 'qrCode';
                },
            });

            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                modules: [imageModule],
            });

            // Prepare document data
            const documentData = { ...data, Signature: signaturePath, Court: courtName };
            const qrCodeUrl = `${frontendUrl}/document/${documentId}`;
            const qrCodeFileName = `${documentId}_qrcode.png`;
            const qrCodePath = path.join(qrCodeDir, qrCodeFileName);
            await QRCode.toFile(qrCodePath, qrCodeUrl, {
                width: 100,
                margin: 1,
            });
            documentData['qrCode'] = qrCodePath.replace(/\\/g, '/');

            // Render document
            doc.render(documentData);

            // Generate DOCX buffer
            const filledDocxBuf = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            // Convert to PDF
            const pdfBuf = await convertToPDF(filledDocxBuf);

            // Save PDF
            const signedPdfPath = path.join(signedDir, `${documentId}_signed.pdf`);
            fs.writeFileSync(signedPdfPath, pdfBuf);

            // Update document in database
            await templateServices.updateOne(
                { id: requestId, 'data.id': documentId },
                {
                    $set: {
                        'data.$.signedPath': signedPdfPath,
                        'data.$.signStatus': signStatus.Signed,
                        'data.$.signedDate': new Date(),
                        'data.$.qrCodePath': qrCodePath,
                        updatedBy: userId,
                        updatedAt: new Date(),
                    },
                }
            );

            // Check if all documents are processed
            const request = await templateServices.findOne({ id: requestId });
            const allSigned = request.data.every(doc => doc.signStatus === signStatus.Signed || doc.signStatus === signStatus.rejected);
            if (allSigned) {
                await templateServices.updateOne(
                    { id: requestId },
                    {
                        $set: {
                            signStatus: signStatus.Signed,
                            updatedBy: userId,
                            updatedAt: new Date(),
                        },
                    }
                );

                // Emit event for request signed
                const io = req.app.get('io');
                if (io) {
                    io.emit('requestSigned', {
                        createdBy: request.createdBy,
                        officerId: request.assignedTo,
                    });
                }
            }

            return { documentId, status: 'success', signedPdfPath };
        } catch (error) {
            console.error(`Error processing document ${documentId}:`, error);
            // Update document status to failed (optional)
            await templateServices.updateOne(
                { id: requestId, 'data.id': documentId },
                {
                    $set: {
                        'data.$.signStatus': signStatus.error,
                        'data.$.errorMessage': error.message,
                        updatedBy: userId,
                        updatedAt: new Date(),
                    },
                }
            );
            throw error;
        }
    },
    {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
        },
    }
);

// Handle worker errors
worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
});

// Handle worker completion
worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed for document ${result.documentId}`);
});