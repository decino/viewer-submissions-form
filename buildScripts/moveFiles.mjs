import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const from = `${path.dirname(fileURLToPath(import.meta.url))}/../dist/src`;
const to = `${path.dirname(fileURLToPath(import.meta.url))}/../dist`;
const enchanter = `${path.dirname(fileURLToPath(import.meta.url))}/../src/public/assets/vendor/Enchanter`;

const moveFiles = async (sourceDir, destinationDir) => {
    try {
        const files = await fs.readdir(sourceDir);
        const pArr = files.map(file => {
            const sourceFile = path.join(sourceDir, file);
            const destFile = path.join(destinationDir, file);
            return fs.rename(sourceFile, destFile);
        });
        await Promise.all(pArr);
        const enchanterSource = path.join(enchanter, 'enchanter.js');
        const enchanterDest = path.join(destinationDir, 'public/assets/vendor/Enchanter/enchanter.js');
        await fs.copyFile(enchanterSource, enchanterDest);
        console.log("All files moved successfully");
    } catch (err) {
        console.error("An error occurred while moving files", err);
    }
};

await moveFiles(from, to);
await fs.rmdir(from);
