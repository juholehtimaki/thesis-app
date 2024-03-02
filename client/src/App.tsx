import React, { SyntheticEvent, useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import List from '@mui/material/List';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Input,
  ListItem,
  ListItemIcon,
  ListItemText,
  Modal,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { v4 as uuidv4 } from 'uuid';

const apiBaseUrl = process.env.REACT_APP_API;

interface NoteModel {
  id: string;
  text: string;
}

function App() {
  const [notes, setNotes] = useState<NoteModel[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editedNoteText, setEditedNoteText] = useState('');

  useEffect(() => {
    const fetchInitialNotes = async () => {
      try {
        const { data } = await axios.get(`${apiBaseUrl}/notes`);
        setNotes(data as NoteModel[]);
      } catch (e: any) {
        console.error(e);
      }
    };
    fetchInitialNotes();
  }, []);

  const createNote = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (newNote.length === 0) return;
    const noteToPost: NoteModel = {
      id: uuidv4(),
      text: newNote,
    };
    try {
      const post = await axios.post(`${apiBaseUrl}/notes`, noteToPost);
      setNotes([...notes, post.data]);
      setNewNote('');
    } catch (e: any) {
      console.error(e);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await axios.delete(`${apiBaseUrl}/notes/${id}`);
      const notesAfterDeletion = notes.filter((note) => note.id !== id);
      setNotes(notesAfterDeletion);
    } catch (e: any) {
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
        await axios.put(`${apiBaseUrl}/notes/${editNoteId}`, {
          text: editedNoteText,
        });
        const updatedNotes = notes.map((note) =>
          note.id === editNoteId ? { ...note, text: editedNoteText } : note,
        );
        setNotes(updatedNotes);
        setEditNoteId(null);
        setEditedNoteText('');
      } catch (e: any) {
        console.error(e);
      }
    }
  };

  const handleCloseModal = () => {
    setEditNoteId(null);
    setEditedNoteText('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h4>Submit a new note:</h4>
        <form onSubmit={createNote}>
          <Input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={newNote.length === 0}
          >
            Submit
          </Button>
        </form>
        <h4>Current notes:</h4>
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
              <h2>Edit Note</h2>
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
      </header>
    </div>
  );
}

export default App;
