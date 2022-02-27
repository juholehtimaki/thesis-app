import React, { SyntheticEvent, useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import List from '@mui/material/List';
import {
  Button,
  IconButton,
  Input,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';

const apiBaseUrl = process.env.REACT_APP_API;

interface NoteModel {
  id: string;
  text: string;
}

function App() {
  const [notes, setNotes] = useState<NoteModel[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const fetchInitialNotes = async () => {
      try {
        const { data } = await axios.get(`${apiBaseUrl}/notes`);
        setNotes(data.Items as NoteModel[]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
      }
    };
    fetchInitialNotes();
  }, []);

  const createNote = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (newNote.length === 0) return;
    const noteToPost: NoteModel = {
      id: uuidv4(),
      text: newNote,
    };
    try {
      await axios.put(`${apiBaseUrl}/notes`, noteToPost);
      setNotes([...notes, noteToPost]);
      setNewNote('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await axios.delete(`${apiBaseUrl}/notes/${id}`);
      const notesAfterDeletion = notes.filter((note) => note.id !== id);
      setNotes(notesAfterDeletion);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
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
          <Button type="submit" variant="contained">
            Submit
          </Button>
        </form>
        <h4>Current notes:</h4>
        <List>
          {notes.map((note) => (
            <ListItem key={note.id}>
              <ListItemText primary={note.text} />
              <ListItemIcon>
                <IconButton onClick={() => deleteNote(note.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemIcon>
            </ListItem>
          ))}
        </List>
      </header>
    </div>
  );
}

export default App;
