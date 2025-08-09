import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fqchfixofctbyywmfdnr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxY2hmaXhvZmN0Ynl5d21mZG5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjUzMTUsImV4cCI6MjA2MjIwMTMxNX0.dNAuRXo8ekU1f97O6M4J4B4QIKpwoXLaIhbdRMYYYTQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function mediaUpload(file) {
    if (!file) {
        throw new Error("No file selected");
    }

    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;

    const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file, {
            upsert: false,
            cacheControl: "3600",
        });

    if (error) {
        throw new Error("Upload failed: " + error.message);
    }

    // Make sure the uploaded file has a public URL
    const { data: publicData, error: publicUrlError } = supabase
        .storage
        .from("images")
        .getPublicUrl(fileName);

    if (publicUrlError || !publicData?.publicUrl) {
        throw new Error("Failed to get public URL");
    }

    return publicData.publicUrl;
}
