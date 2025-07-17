import * as XLSX from "xlsx";
import mongoose from "mongoose";
import { signStatus } from "../libs/constants";

export const parseExcelFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const headers = jsonData[0] as string[];
  const rows = jsonData.slice(1) as any[][];

  const dataEntries: any[] = [];
  rows.forEach((row) => {
    const rowData: Record<string, any> = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || "";
    });
    dataEntries.push({
      id: new mongoose.Types.ObjectId().toString(),
      url: file.name,
      data: rowData,
      signStatus: signStatus.unsigned,
      createdAt: new Date().toLocaleString(),
    });
  });

  return dataEntries;
};

export const generateExcelTemplate = (templateVariables: string[], title: string) => {
  if (!templateVariables.length) {
    throw new Error("No variables to include in Excel template");
  }
  const ws = XLSX.utils.json_to_sheet([{}], { header: templateVariables });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}_template.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};
