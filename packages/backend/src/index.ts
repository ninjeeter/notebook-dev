import type { SDK, DefineAPI } from "caido:plugin";
import type { PluginStorage } from "packages/frontend/src/types";
import { FileHandle, open } from "fs/promises";
import { Mutex } from "async-mutex";

// Define a mutex to handle file access.
const FILE_MUTEX = new Mutex();

// Define a variable for the file handle.
let FILE: FileHandle | null = null;

// Function to write notes to a file.
async function writeNotesToFile(sdk: SDK, notes: PluginStorage["notes"]): Promise<void> {
  await FILE_MUTEX.runExclusive(async () => {
    // Ensure FILE is opened.
    if (FILE) {
      await FILE.truncate(0);

      for (const note of notes) {
        // Start with the datetime and newline
        let noteContent = `\r${note.datetime}\n`;

        // Add note content with indentation
        noteContent += `${note.note.split('\n').map(line => `\t${line}`).join('\n')}\n`;

        // Optionally add project name and comment
        if (note.projectName) {
          noteContent += `\t(Project: ${note.projectName})\n`;
        }
        if (note.comment) {
          noteContent += `\t(Comment: ${note.comment})\n`;
        }

        // Write the formatted note content to the file
        await FILE.write(noteContent);
      }
    }
  });
}

export type API = DefineAPI<{
  writeNotes: typeof writeNotesToFile;
}>;

export async function init(sdk: SDK) {
  // Open file for appending.
  FILE = await open("C:\\Users\\ahnde\\Downloads\\output.txt", "w");

  // Register the writeNotes function as an API endpoint
  sdk.api.register("writeNotes", writeNotesToFile);
}
