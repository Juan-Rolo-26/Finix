import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
    "https://apxfsuxftnovgkvdrwpx.supabase.co",
    "sb_publishable_1R8SGghwzgAzT7HjOeGMZw_fINqXZZs"
);

async function run() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: "juanpablorolo2007@gmail.com",
        password: "Password123!"
    });
    if (error) {
        console.error("Login failed:", error.message);
    } else {
        fs.writeFileSync("token.txt", data.session.access_token);
        console.log("Token saved");
    }
}
run();
