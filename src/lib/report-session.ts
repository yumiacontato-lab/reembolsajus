export type ReviewItemStatus = "reimbursable" | "possible";

export type ReviewItem = {
  id: string;
  date: string;
  description: string;
  value: number;
  tag: string;
  status: ReviewItemStatus;
  client: string;
};

export type UploadSession = {
  uploadId: string;
  filename: string;
  uploadedAt: string;
  items: ReviewItem[];
};

export type ReportItem = {
  description: string;
  value: number;
  client: string;
};

export type ReportSession = {
  id: string;
  createdAt: string;
  filename: string;
  source: string;
  itemCount: number;
  totalValue: number;
  items: ReportItem[];
};

export const UPLOAD_SESSION_STORAGE_KEY = "reembolsajus:upload:current";
export const REPORT_SESSION_STORAGE_KEY = "reembolsajus:report:current";

export const buildInitialItemsFromUpload = (): ReviewItem[] => {
  return [
    {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      description: "LANÇAMENTO IDENTIFICADO (REVISAR)",
      value: 0,
      tag: "REVISAR",
      status: "possible",
      client: "",
    },
  ];
};