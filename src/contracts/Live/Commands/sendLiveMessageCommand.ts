export interface SendLiveMessageCommand {
  text: string;
  kind?: "message" | "announcement" | null;
}
