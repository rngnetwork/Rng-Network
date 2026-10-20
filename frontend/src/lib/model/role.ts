export interface ServerRole {
  id: string;
  name: string;
  colorHex?: string | null;
  position: number;
  managed: boolean;
  assignableByBot: boolean;
}
