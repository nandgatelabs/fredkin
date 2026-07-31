import { Platform, Share } from "react-native";

/** Download or share a text file (CSV). Web uses a Blob download; native uses Share. */
export async function downloadTextFile(fileName: string, text: string, mime = "text/csv") {
  if (Platform.OS === "web") {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({
    title: fileName,
    message: text,
  });
}
