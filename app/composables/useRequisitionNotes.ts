// Requisition notes — fixture/local today (mirrors useJobNotes). Swap for a
// Vue Query call + useMutation when the API lands.

export type NoteVisibility = 'everyone' | 'admins' | 'me'

export interface RequisitionNoteItem {
  id: string
  reqId: string
  userName: string
  userInitials: string
  text: string
  visibility: NoteVisibility
  createdAt: string
}

const store = ref<RequisitionNoteItem[]>([])
let seq = 0
const nextId = () => `rn${++seq}`

export function useRequisitionNotes(reqId: string) {
  const notes = computed(() => store.value.filter(n => n.reqId === reqId))

  function addNote(text: string, visibility: NoteVisibility) {
    const clean = text.trim()
    if (!clean) return
    store.value = [
      { id: nextId(), reqId, userName: 'Mohamed Salem', userInitials: 'MS', text: clean, visibility, createdAt: 'just now' },
      ...store.value,
    ]
  }
  function removeNote(id: string) {
    store.value = store.value.filter(n => n.id !== id)
  }

  return { notes, addNote, removeNote }
}
