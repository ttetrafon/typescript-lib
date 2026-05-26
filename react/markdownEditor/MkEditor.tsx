import { emptyDocument, type DataLink, type GameSystemData, type MkDocument } from "@app-types/game";
import { useGameSystem } from "~/context/GameSystemContext";
import { EditorToolbarSeparator } from "../../../../app/components/generic/EditorToolbarSeparator";
import { useCallback, useRef, useState } from "react";
import { EditorButton } from "../../../../app/components/generic/EditorButton";
import { changeBlockType } from "util/lib/react/markdownEditor/EditorScripts";

export interface EditorProps {
  editable: boolean,
  dataSystem: string,
  dataKey: string,
  gameData: GameSystemData | null,
}

export function MkEditor({ ...props }: EditorProps) {
  const { data } = useGameSystem();
  const keyParts = props.dataKey.split('.');
  const doc = keyParts.reduce((obj, part) => obj?.[part], props.gameData as any) as MkDocument | undefined;
  const document = doc ?? emptyDocument();

  const contentsRef = useRef<HTMLElement>(null);

  const isLineInDocument = function (lineId: string | undefined): boolean {
    if (!lineId) return false;
    return document.blocks[lineId] !== undefined;
  }

  return (
    <>
      {/* editor controls */}
      {props.editable && <section className="min-h-4 flex flex-row flex-nowrap lg:flex-wrap md:gap-1 justify-center w-full mb-2 overflow-x-auto">
        {/* <EditorButton text="Heading 1" icon="h1" onClick={() => changeBlockType(lastFocusedRef, 'h1', pushAndSend)} />
        <EditorButton text="Heading 2" icon="h2" onClick={() => changeBlockType(lastFocusedRef, 'h2', pushAndSend)} />
        <EditorButton text="Heading 3" icon="h3" onClick={() => changeBlockType(lastFocusedRef, 'h3', pushAndSend)} />
        <EditorButton text="Heading 4" icon="h4" onClick={() => changeBlockType(lastFocusedRef, 'h4', pushAndSend)} />
        <EditorButton text="Heading 5" icon="h5" onClick={() => changeBlockType(lastFocusedRef, 'h5', pushAndSend)} />
        <EditorButton text="Heading 6" icon="h6" onClick={() => changeBlockType(lastFocusedRef, 'h6', pushAndSend)} />
        <EditorButton text="Text" icon="text" onClick={() => changeBlockType(lastFocusedRef, 'p', pushAndSend)} />
        <EditorButton text="Bulleted List" icon="format_list_bulleted" onClick={() => { }} />
        <EditorButton text="Numbered List" icon="format_list_numbered" onClick={() => { }} />
        <EditorButton text="Quote" icon="format_quote" onClick={() => changeBlockType(lastFocusedRef, 'blockquote', pushAndSend)} /> */}

        <EditorToolbarSeparator color="var(--color-action)" />

        {/* <EditorButton text="Bold" icon="format_bold" onClick={() => { }} />
        <EditorButton text="Italic" icon="format_italic" onClick={() => { }} />
        <EditorButton text="Underline" icon="format_underlined" onClick={() => { }} />
        <EditorButton text="Strikethrough" icon="strikethrough" onClick={() => { }} /> */}

        <EditorToolbarSeparator color="var(--color-action)" />

        {/* <EditorButton text="Table" icon="table" onClick={() => insertTable(lastFocusedRef, contentsRef, pushAndSend)} />
        <EditorButton text="Game System Link" icon="dataset_linked" onClick={() => setGameLinkModalOpen(true)} disabled={!isWithinText} />
        <EditorButton text="Special Block" icon="folder_special" >
          <button className="text-nowrap" onClick={() => { insertMoralityPairsBlock(lastFocusedCellRef, contentsRef, pushAndSend); mountReactPlaceholders(props.editable); }}>Morality Pairs</button>
        </EditorButton> */}

        <EditorToolbarSeparator color="var(--color-action)" />

        {/* <EditorButton text="Decrease Indent" icon="format_intent_decrease" onClick={() => { }} />
        <EditorButton text="Increase Indent" icon="format_indent_increase" onClick={() => { }} /> */}
      </section>}
      {/* contents */}
      <section className="overflow-auto min-h-0 flex-1"
        ref={contentsRef}
        onFocus={(e) => {
          const target = e.target as HTMLElement;
        }}
        onBlur={(e) => {
          const target = e.target as HTMLElement;
        }}
        onClick={(e) => {
          /**
           * Clicking anywhere in the editor's area should:
           * if on one of the lines, focus on that line's input
           * if outside of the lines, create a new line and focus on it
           */
          const target = e.target as HTMLElement;
          // console.log("Clicked on editor content:", target);

          if (isLineInDocument(target.id)) {
            console.log("Clicked on line with ID:", target.id);
            // TODO: focus on the line's input
          }
          else {
            console.log("Clicked outside of document lines");
            // TODO: add a new line in the document (command to the server)
            // TODO: focus on the new line's input after it has been created
          }
        }}
      />
    </>
  );
}
