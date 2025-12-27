const db = require('../config/db');

exports.getHeadToHead = async (req, res) => {
    const myId = req.user.id;
    const otherId = req.params.id;

    if (parseInt(myId) === parseInt(otherId)) {
        return res.status(400).json({ error: "Cannot calculate head-to-head with yourself" });
    }

    try {
        // Query to find matches where both users participated
        const query = `
            SELECT 
                m.id, 
                m.date_time, 
                m.sport_type, 
                m.score_team_a, 
                m.score_team_b,
                p1.team as my_team,
                p2.team as other_team
            FROM matches m
            JOIN participants p1 ON m.id = p1.match_id
            JOIN participants p2 ON m.id = p2.match_id
            WHERE p1.user_id = ? 
            AND p2.user_id = ?
            AND p1.status = 'confirmed' 
            AND p2.status = 'confirmed'
            AND m.status = 'finished'
            ORDER BY m.date_time DESC
        `;

        const [matches] = await db.query(query, [myId, otherId]);

        let stats = {
            total_matches: matches.length,
            played_together: 0,
            played_against: 0,
            together: {
                wins: 0,
                losses: 0,
                draws: 0
            },
            against: {
                wins: 0,
                losses: 0,
                draws: 0
            },
            last_5_matches: []
        };

        matches.forEach(match => {
            const myTeam = match.my_team;
            const otherTeam = match.other_team;

            // Determine match result for "myTeam"
            let myResult = 'draw';
            if (match.score_team_a !== null && match.score_team_b !== null) {
                if (match.score_team_a > match.score_team_b) {
                    myResult = myTeam === 'A' ? 'win' : 'loss';
                } else if (match.score_team_b > match.score_team_a) {
                    myResult = myTeam === 'B' ? 'win' : 'loss';
                }
            }

            // Played Together
            if (myTeam === otherTeam) {
                stats.played_together++;
                if (myResult === 'win') stats.together.wins++;
                else if (myResult === 'loss') stats.together.losses++;
                else stats.together.draws++;
            }
            // Played Against
            else {
                stats.played_against++;
                if (myResult === 'win') stats.against.wins++;
                else if (myResult === 'loss') stats.against.losses++;
                else stats.against.draws++;
            }

            // Add to history (limit to last 5)
            if (stats.last_5_matches.length < 5) {
                stats.last_5_matches.push({
                    id: match.id,
                    date: match.date_time,
                    sport: match.sport_type,
                    played_together: myTeam === otherTeam,
                    result: myResult,
                    score: `${match.score_team_a}-${match.score_team_b}`
                });
            }
        });

        res.json(stats);

    } catch (error) {
        console.error('Head to head stats error:', error);
        res.status(500).json({ error: 'Server error fetching head-to-head stats' });
    }
};
