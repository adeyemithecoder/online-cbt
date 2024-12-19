import * as XLSX from "xlsx";
const ReadExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target || typeof e.target.result !== "object") {
        reject(new Error("Invalid file format"));
        return;
      }
      const data = new Uint8Array(e.target.result);
      const workBook = XLSX.read(data, { type: "array" });
      const sheetname = workBook.SheetNames[0];
      const sheet = workBook.Sheets[sheetname];
      const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      resolve(excelData);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
};

export default ReadExcel;
