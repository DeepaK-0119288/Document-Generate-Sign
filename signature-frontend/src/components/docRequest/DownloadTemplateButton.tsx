import React from "react";
import { Button, message } from "antd";
import * as XLSX from "xlsx";
import type { Request } from "../../@types/interfaces/Request";

interface DownloadTemplateButtonProps {
  request: Request | null;
}

const DownloadTemplateButton: React.FC<DownloadTemplateButtonProps> = ({ request }) => {
  const handleDownloadTemplate = () => {
    if (!request?.templateVariables) {
      message.error("No template variables available");
      return;
    }

    const excelVariables = request.templateVariables
      .filter((v) => v.showOnExcel)
      .map((v) => v.name);

    if (excelVariables.length === 0) {
      message.error("No variables to include in Excel template");
      return;
    }

    const ws = XLSX.utils.json_to_sheet([{}], { header: excelVariables });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${request.title}_template.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <Button onClick={handleDownloadTemplate}>Download Template</Button>;
};

export default DownloadTemplateButton;
