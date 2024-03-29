import React, { SyntheticEvent, useEffect, useState } from 'react';
import List from '@mui/material/List';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  FormGroup,
  IconButton,
  Input,
  ListItem,
  ListItemIcon,
  ListItemText,
  Modal,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '../services/notes/types';
import { notesService } from '../services/notes';

export default function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editedNoteText, setEditedNoteText] = useState('');

  useEffect(() => {
    const fetchInitialNotes = async () => {
      try {
        const fetchedNotes = await notesService.fetchNotes();
        setNotes(fetchedNotes);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    };
    fetchInitialNotes();
  }, []);

  const createNote = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (newNote.length === 0) return;
    const noteToPost: Note = {
      id: uuidv4(),
      text: newNote,
    };
    try {
      const postedNote = await notesService.createNote(noteToPost);
      setNotes([...notes, postedNote]);
      setNewNote('');
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await notesService.deleteNote(id);
      const notesAfterDeletion = notes.filter((note) => note.id !== id);
      setNotes(notesAfterDeletion);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const openEditModal = (id: string, text: string) => {
    setEditNoteId(id);
    setEditedNoteText(text);
  };

  const updateNote = async () => {
    if (editNoteId && editedNoteText.length > 0) {
      try {
        notesService.updateNote(editNoteId, editedNoteText);
        const updatedNotes = notes.map((note) =>
          note.id === editNoteId ? { ...note, text: editedNoteText } : note,
        );
        setNotes(updatedNotes);
        setEditNoteId(null);
        setEditedNoteText('');
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  };

  const handleCloseModal = () => {
    setEditNoteId(null);
    setEditedNoteText('');
  };

  return (
    <Container>
      <Typography variant="h4">Submit a new note:</Typography>
      <FormGroup style={{ marginTop: '20px' }}>
        <Input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <Button
          onClick={createNote}
          variant="contained"
          disabled={newNote.length === 0}
        >
          Submit
        </Button>
      </FormGroup>
      <Typography style={{ marginTop: '20px' }} variant="h4">
        Current notes:
      </Typography>
      <List>
        {notes.map((note) => (
          <ListItem key={note.id}>
            <ListItemText primary={note.text} />
            <ListItemIcon>
              <IconButton onClick={() => openEditModal(note.id, note.text)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => deleteNote(note.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemIcon>
          </ListItem>
        ))}
      </List>
      <Modal
        open={!!editNoteId}
        onClose={handleCloseModal}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h2">Edit Note</Typography>
            <Input
              type="text"
              value={editedNoteText}
              onChange={(e) => setEditedNoteText(e.target.value)}
            />
          </CardContent>
          <CardActions style={{ justifyContent: 'center' }}>
            <Button variant="contained" onClick={updateNote}>
              Update
            </Button>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </CardActions>
        </Card>
      </Modal>
    </Container>
  );
}
