import { useEffect, useState } from "react";
import { getCustomerNotes, addNote, CustomerNote } from "@/lib/customers-api";

export function CustomerNotesTab({ customerId, onUpdated }: { customerId: number, onUpdated: () => void }) {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [content, setContent] = useState("");

  const load = async () => setNotes(await getCustomerNotes(customerId));
  useEffect(() => { load(); }, [customerId]);

  const submit = async () => {
    if (!content.trim()) return;
    await addNote(customerId, { content });
    setContent("");
    load();
    onUpdated();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-zinc-100">Notes</h3>
      <div className="flex gap-4">
        <textarea 
          value={content} onChange={(e) => setContent(e.target.value)} 
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500" 
          placeholder="Add a new note..." rows={3} 
        />
      </div>
      <button onClick={submit} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">Add Note</button>
      
      <div className="space-y-4 mt-6">
        {notes.map(note => (
          <div key={note.id} className="rounded-xl border border-white/10 p-4 bg-white/[0.01]">
            <p className="text-zinc-200 text-sm">{note.content}</p>
            <p className="text-xs text-zinc-500 mt-2">{new Date(note.created_at).toLocaleString()} by {note.created_by || "System"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
