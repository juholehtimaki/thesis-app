import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Note } from './types';

const apiBaseUrl = process.env.REACT_APP_API;

const getToken = async () => {
  const fetchSessionResult = await fetchAuthSession();
  const token = fetchSessionResult.tokens?.idToken?.toString();
  if (!token) return undefined;
  return {
    headers: {
      Authorization: token,
    },
  };
};

const fetchNotes = async (): Promise<Note[]> => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/notes`, await getToken());
    return data as Note[];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API: Error fetching notes:', error);
    throw error;
  }
};

const createNote = async (newNote: Note): Promise<Note> => {
  try {
    const response = await axios.post(
      `${apiBaseUrl}/notes`,
      newNote,
      await getToken(),
    );
    return response.data as Note;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API: Error creating note:', error);
    throw error;
  }
};

const deleteNote = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${apiBaseUrl}/notes/${id}`, await getToken());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API: Error deleting note:', error);
    throw error;
  }
};

const updateNote = async (id: string, updatedText: string): Promise<Note> => {
  try {
    const response = await axios.put(
      `${apiBaseUrl}/notes/${id}`,
      {
        text: updatedText,
      },
      await getToken(),
    );
    return response.data as Note;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API: Error updating note:', error);
    throw error;
  }
};

export const notesService = {
  updateNote,
  deleteNote,
  createNote,
  fetchNotes,
};
