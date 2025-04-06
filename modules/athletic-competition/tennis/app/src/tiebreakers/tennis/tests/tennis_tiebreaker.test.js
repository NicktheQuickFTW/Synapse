import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TennisTiebreaker from '../components/TennisTiebreaker';

// Mock fetch
global.fetch = jest.fn();

describe('TennisTiebreaker Component', () => {
    const mockProps = {
        matchId: 'test-match-1',
        player1: {
            id: 'p1',
            name: 'Player 1'
        },
        player2: {
            id: 'p2',
            name: 'Player 2'
        }
    };

    beforeEach(() => {
        fetch.mockClear();
    });

    it('renders loading state initially', () => {
        render(<TennisTiebreaker {...mockProps} />);
        expect(screen.getByText('Loading tiebreaker data...')).toBeInTheDocument();
    });

    it('renders error state when fetch fails', async () => {
        fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
        
        render(<TennisTiebreaker {...mockProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Error: Failed to fetch tiebreaker data')).toBeInTheDocument();
        });
    });

    it('renders tiebreaker data correctly', async () => {
        const mockData = {
            player1Score: 7,
            player2Score: 5,
            status: 'Completed',
            currentServer: 'Player 1'
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        render(<TennisTiebreaker {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Status: Completed')).toBeInTheDocument();
            expect(screen.getByText('Current Server: Player 1')).toBeInTheDocument();
        });
    });

    it('handles point recording correctly', async () => {
        const mockData = {
            player1Score: 0,
            player2Score: 0,
            status: 'In Progress',
            currentServer: 'Player 1'
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        render(<TennisTiebreaker {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('Point for Player 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Point for Player 1'));

        expect(fetch).toHaveBeenCalledWith('/api/tiebreaker/tennis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                matchId: mockProps.matchId,
                playerNumber: 1,
            }),
        });
    });

    it('disables buttons when tiebreaker is completed', async () => {
        const mockData = {
            player1Score: 7,
            player2Score: 5,
            status: 'Completed',
            currentServer: 'Player 1'
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        render(<TennisTiebreaker {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('Point for Player 1')).toBeDisabled();
            expect(screen.getByText('Point for Player 2')).toBeDisabled();
        });
    });
}); 