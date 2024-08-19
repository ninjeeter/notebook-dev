// Imports frontend interface.
import type { Caido } from "@caido/sdk-frontend";
// Imports backend in order to register backend function.
import type { API } from "starterkit-plugin-backend";

import type { PluginStorage } from "./types";

import "./styles/style.css";

export type CaidoSDK = Caido<API>;

// Creates path.
const Page = "/notebook";
// Syntax of - identifier: 'namespace.namespaceIdentifier'.
const Commands = {
  clear: "notebook.clear",
  addNoteMenu: "notebook.addNoteMenu",
  randomize: "my-plugin.randomize",
};

// Get notes from storage.
export const getNotes = (sdk: CaidoSDK) => {
  const storage = sdk.storage.get() as PluginStorage | undefined;
  return storage?.notes ?? [];
};

// Function to call backend API to write notes to file.
const outputNotes = async (
    sdk: CaidoSDK,
    datetime: string,
    note: string,
    projectName?: string,
    comment?: string,
  ) => {
    const existingNotes = getNotes(sdk);
    // Create a new note object according to PluginStorage type.
    const newNote = { datetime, note, projectName, comment: comment || "" };
    // Combine the existing notes with the new note.
    const allNotes = [...existingNotes, newNote];
    if (allNotes.length > 0) {
      await sdk.backend.writeNotes(allNotes);
      sdk.window.showToast('Notes have been outputted to file.', { variant: 'info', duration: 5000 });
    } else {
      sdk.window.showToast('No notes available to output.', { variant: 'info', duration: 5000 });
    }
};

// Add note to storage.
const addNoteStorage = async(
  sdk: CaidoSDK,
  datetime: string,
  note: string,
  projectName?: string,
  comment?: string,
) => {
  const currentNotes = getNotes(sdk);
  const updatedNotes = [...currentNotes, { datetime, note, projectName, comment: "" }];
  await sdk.storage.set({ notes: updatedNotes });

  // Print added note to console.
  console.log("Added Note:", { datetime, note, projectName, comment });
};

const table = document.createElement("table");
table.id = "notesTable";

// Reset the page table.
const clear = (sdk: CaidoSDK) => {
  if (table) {
    const tbody = table.querySelector("tbody");
    if (tbody) {
      table.textContent = "";
    }
  }
  sdk.storage.set({ notes: [] });
};

// Add note via highlight selecting text and selecting context menu option.
const addNoteMenu = async (sdk: CaidoSDK) => {
  let currentSelect = sdk.window.getActiveEditor()?.getSelectedText();

  if (currentSelect) {
    const project = await sdk.graphql.currentProject();
    const projectData = project?.currentProject;
    if (projectData) {
      const projectName = projectData.name || "No Project Selected";
      const datetime = new Date().toLocaleString();

      // Add note to storage.
      await addNoteStorage(sdk, datetime, currentSelect, projectName);
      // Popup message of successful addition to note array.
      sdk.window.showToast(`${currentSelect} added to Notebook.`, {variant: "info", duration: 5000});
    }
  }
};

// Plugin page UI construction.
const addPage = (sdk: CaidoSDK) => {
  // Header.
  const headerText = document.createElement("h1");
  headerText.textContent = "Notebook";
  headerText.className = "center";

  // Instructions.
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Instructions";
  summary.classList.add("center", "bold-brown");
  details.appendChild(summary);

  const instructions = document.createElement("p");
  instructions.innerHTML = `<span class="bold-brown">To add a note:</span><br>
    1. Supply input in the textarea located at the bottom and click the <span class="light-brown">Add Note</span> button.<br>
    2. Highlight select text within a request/response pane and click the <span class="light-brown">>_ Commands</span> button located at the topbar in the upper-right corner. Search/Select <span class="light-brown">Add Note to Notebook</span>.<br>
    3. Highlight select text within a request/response pane and open the context menu by right-clicking. Hover over the <span class="light-brown">Plugins</span> item and select <span class="light-brown">Add Note to Notebook</span>.<br>
    4. <span class="light-brown">CTRL+C</span> within request and response panes and <span class="light-brown">CTRL+V</span> into the textarea.<br>
    <br>
    <span class="bold-brown">To edit a note:</span><br>
    1. Click inside the note column.<br>
    2. Unfocus once done.<br>
    <br>
    <span class="bold-brown">To add a comment:</span><br>
    1. Supply input in the textarea in the third column.<br>
    2. Unfocus once done.<br>
    <br>
    <span class="bold-brown">To clear all notes:</span><br>
    <span class="bold-red">***This will reset the notes in storage. This action cannot be undone.***</span><br>
    1. Click the <span class="light-brown">>_ Commands</span> button located at the topbar in the upper-right corner. Search/Select <span class="light-brown">Clear Notes in Notebook</span>.`;
  instructions.className = "center";

  details.appendChild(instructions);

  // Input textarea.
  const textarea = document.createElement("textarea");
  textarea.placeholder = "Enter note here...";
  textarea.classList.add("text-area");

  // Usage example: Button to trigger notes output
  const outputNotesButton = sdk.ui.button({
    variant: "primary",
    label: "Output Notes to File",
  });

  outputNotesButton.addEventListener("click", async () => {
    const textareaValue = textarea.value.trim();
    const datetime = new Date().toLocaleString();
    const project = await sdk.graphql.currentProject();
    const projectName = project?.currentProject?.name || "No Project Selected";
    const comment = "";
    if (textareaValue.length > 0) {
      await outputNotes(sdk, datetime, textareaValue, projectName, comment);
    } else {
      sdk.window.showToast("No new notes available to output.", {
        variant: "info",
        duration: 5000,
      });
    }
  });

  // `Add note.` button.
  const addNoteButton = sdk.ui.button({
    variant: "primary",
    label: "Add Note",
  });

  // On button click if there's input - form the note.
  addNoteButton.addEventListener("click", async () => {
    const datetime = new Date().toLocaleString();
    let inputValue = textarea.value;

    if (inputValue) {
      const project = await sdk.graphql.currentProject();
      const projectData = project?.currentProject;
      const projectName = projectData?.name || "No Project Selected";

      // Add the note to storage.
      await addNoteStorage(sdk, datetime, inputValue, projectName);

      // Clear textarea and reset value.
      inputValue = "";
      textarea.value = "";
    }
  });

  // Combining elements into divs since card properties cannot accept arrays.

  const headerContainer = document.createElement("div");
  headerContainer.appendChild(headerText);
  headerContainer.appendChild(details);

  const tableContainer = document.createElement("div");
  tableContainer.appendChild(table);
  tableContainer.classList.add("table-container");

  const buttonContainer = document.createElement("div");
  buttonContainer.appendChild(addNoteButton);
  buttonContainer.appendChild(outputNotesButton)
  buttonContainer.classList.add("button-container");

  const footerContainer = document.createElement("div");
  footerContainer.appendChild(textarea);
  footerContainer.appendChild(buttonContainer);

  // Card elements.
  const card = sdk.ui.card({
    header: headerContainer,
    body: tableContainer,
    footer: footerContainer,
  });

  // Create plugin page in left tab menu.
  sdk.navigation.addPage(Page, {
    body: card,
  });
};

// Presents stored notes in table.
const displayNotes = (sdk: CaidoSDK, notes: PluginStorage["notes"] | undefined) => {
  const tbody = table.querySelector("tbody");
  if (tbody) {
    table.textContent = "";
  }

  if (!notes) {
    return;
  }

  // Creates row for each note.
  notes.forEach((note, index) => {
    const row = table.insertRow();
    const datetimeCell = row.insertCell();
    const noteCell = row.insertCell();
    const commentCell = row.insertCell();

    // Create container for datetime text and delete button.
    const datetimeContainer = document.createElement("div");
    datetimeContainer.classList.add("datetime-container");

    // DateTime text.
    const datetimeText = document.createElement("span");
    datetimeText.textContent = `${note.datetime} Project: ${note.projectName}`;
    datetimeText.classList.add("datetime-text");

    // `Remove note.` button.
    const removeNoteButton = sdk.ui.button({
      variant: "primary",
      label: "Delete",
      trailingIcon: "fas fa-trash-can",
      size: "small"
    });

    // When 'Remove note.' button is clicked - removes the last note from array.
    removeNoteButton.addEventListener("click", async () => {
      const currentNotes = getNotes(sdk);
      const updatedNotes = currentNotes.filter((_, i) => i !== index);

      // Sets note array minus removed note.
      await sdk.storage.set({ notes: updatedNotes });
      displayNotes(sdk, updatedNotes);
    });

    // Datetime and 'Remove note.' button content.
    datetimeContainer.appendChild(datetimeText);
    datetimeContainer.appendChild(removeNoteButton);

    // Add datetime and 'Remove note.' content to datetime cell.
    datetimeCell.appendChild(datetimeContainer);
    datetimeCell.classList.add("datetime-cell");

    // Enables note entry editing.
    const editableNote = document.createElement("div");
    editableNote.contentEditable = "true";
    editableNote.spellcheck = false;
    editableNote.textContent = note.note;
    editableNote.classList.add("text-area-edit");

    editableNote.addEventListener("blur", async () => {
      // Update the note in storage when editing is finished.
      const updatedNotes = [...notes];
      updatedNotes[index].note = editableNote.textContent || "";
      await sdk.storage.set({ notes: updatedNotes });
      displayNotes(sdk, updatedNotes);
    });

    noteCell.appendChild(editableNote);

    // Create textarea for comments.
    const commentTextarea = document.createElement("textarea");
    commentTextarea.placeholder = "Add your comments here...";
    commentTextarea.value = note.comment || ""; // Use existing comment if present.
    commentTextarea.classList.add("comment-text-area");

    commentTextarea.addEventListener("blur", async () => {
      // Update the comment in storage when editing is finished.
      const updatedNotes = [...notes];
      updatedNotes[index].comment = commentTextarea.value;
      await sdk.storage.set({ notes: updatedNotes });
      displayNotes(sdk, updatedNotes);
    });

    commentCell.appendChild(commentTextarea);
  })
};

export const init = (sdk: CaidoSDK) => {
  // Retrieve notes from storage
  const notes = getNotes(sdk);
  console.log("Current notes:", notes);

  // Populate table with stored notes.
  displayNotes(sdk, notes);

  sdk.storage.onChange((value) => {
    displayNotes(sdk,(value as PluginStorage | undefined)?.notes);
  });

  // Register commands.
  // Commands are registered with a unique identifier and a handler function.
  // The run function is called when the command is executed.
  // These commands can be registered in various places like command palette, context menu, etc.
  sdk.commands.register(Commands.clear, {
    name: "Clear Notes in Notebook",
    run: () => clear(sdk),
  });

  sdk.commands.register(Commands.addNoteMenu, {
    name: "Add Note to Notebook",
    run: () => addNoteMenu(sdk),
  });

  // Register command palette items.
  sdk.commandPalette.register(Commands.clear);

  sdk.commandPalette.register(Commands.addNoteMenu);

  // Register context menu options.
  sdk.menu.registerItem({
    type: "Request",
    commandId: Commands.addNoteMenu,
    leadingIcon: "fas fa-book",
  });

  sdk.menu.registerItem({
    type: "Response",
    commandId: Commands.addNoteMenu,
    leadingIcon: "fas fa-book",
  });

  // Register page.
  addPage(sdk);

  // Register sidebar.
  sdk.sidebar.registerItem("Notebook", Page, {
    icon: "fas fa-book",
  });
};