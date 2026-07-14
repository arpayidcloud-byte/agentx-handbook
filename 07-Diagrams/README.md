# 07-Diagrams

Per Volume 1, Ch. 5 (Document Conventions), the **source of truth** for all architecture
diagrams is inline Mermaid inside each Volume's Markdown file — this keeps diagrams
diffable in version control and prevents a second, driftable source of truth.

This folder's purpose is narrowed accordingly (Volume 1, Recommended Addition #7): it
holds **exported PNG/SVG snapshots** of Mermaid diagrams for use *outside* the repository
(slides, external docs, README badges) — never the primary or only copy of a diagram.

**Status:** Not yet populated — no diagrams have been exported yet. To add one:

1. Render the Mermaid block from its owning Volume (e.g., Volume 2, Ch. 1's state diagram).
2. Export as `volume-NN-<diagram-name>.svg`.
3. Never hand-edit the exported file — regenerate from the Volume's Mermaid source if the
   diagram changes, so this folder cannot drift from the Volumes.

If a diagram is needed only inside the handbook itself, it belongs in the Volume's
Markdown directly and does not need an entry here at all.
