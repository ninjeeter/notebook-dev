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
      for (const note of notes) {
        await FILE.write(
          `TEST ${note.datetime} - ${note.note} ${note.projectName ? `(Project: ${note.projectName})` : ''} ${note.comment ? `(Comment: ${note.comment})` : ''}\n`
        );
      }
    }
  });
}

export type API = DefineAPI<{
  writeNotes: typeof writeNotesToFile;
}>;

export async function init(sdk: SDK) {
  // Open file for appending.
  FILE = await open("C:\\Users\\ahnde\\Downloads\\output.txt", "a");

  // Register the writeNotes function as an API endpoint
  sdk.api.register("writeNotes", writeNotesToFile);
}
