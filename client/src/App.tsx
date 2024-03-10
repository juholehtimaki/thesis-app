import React from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import type { WithAuthenticatorProps } from '@aws-amplify/ui-react';
import { Button, Container } from '@mui/material';
import './App.css';
import NoteList from './components/NoteList';

function App({ signOut }: WithAuthenticatorProps) {
  return (
    <Container className="app">
      <Button type="button" onClick={signOut}>
        Log out
      </Button>
      <NoteList />
    </Container>
  );
}

export default withAuthenticator(App);
