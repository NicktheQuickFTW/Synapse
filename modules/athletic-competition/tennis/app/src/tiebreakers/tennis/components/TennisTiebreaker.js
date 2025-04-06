import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './TennisTiebreaker.css';

const TennisTiebreaker = ({ matchId, player1, player2 }) => {
    const [tiebreakerData, setTiebreakerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTiebreakerData();
    }, [matchId]);

    const fetchTiebreakerData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tiebreaker/tennis?matchId=${matchId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch tiebreaker data');
            }
            const data = await response.json();
            setTiebreakerData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="tiebreaker-loading">Loading tiebreaker data...</div>;
    }

    if (error) {
        return <div className="tiebreaker-error">Error: {error}</div>;
    }

    return (
        <div className="tennis-tiebreaker">
            <h2>Tennis Tiebreaker</h2>
            <div className="players">
                <div className="player player1">
                    <h3>{player1.name}</h3>
                    <div className="score">{tiebreakerData?.player1Score || 0}</div>
                </div>
                <div className="player player2">
                    <h3>{player2.name}</h3>
                    <div className="score">{tiebreakerData?.player2Score || 0}</div>
                </div>
            </div>
            <div className="tiebreaker-status">
                <p>Status: {tiebreakerData?.status || 'In Progress'}</p>
                <p>Current Server: {tiebreakerData?.currentServer || 'Not Set'}</p>
            </div>
            <div className="tiebreaker-controls">
                <button 
                    onClick={() => handlePoint(1)}
                    disabled={tiebreakerData?.status === 'Completed'}
                >
                    Point for {player1.name}
                </button>
                <button 
                    onClick={() => handlePoint(2)}
                    disabled={tiebreakerData?.status === 'Completed'}
                >
                    Point for {player2.name}
                </button>
            </div>
        </div>
    );
};

const handlePoint = async (playerNumber) => {
    try {
        const response = await fetch('/api/tiebreaker/tennis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                matchId,
                playerNumber,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to record point');
        }

        // Refresh tiebreaker data
        fetchTiebreakerData();
    } catch (err) {
        console.error('Error recording point:', err);
    }
};

TennisTiebreaker.propTypes = {
    matchId: PropTypes.string.isRequired,
    player1: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
    player2: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
};

export default TennisTiebreaker; 