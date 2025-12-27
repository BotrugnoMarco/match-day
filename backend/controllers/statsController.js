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

exports.getRivals = async (req, res) => {
    const userId = req.params.id;

    try {
        const query = `
            SELECT
                p2.user_id,
                u.username,
                u.avatar_url,
                COUNT(CASE WHEN p1.team = p2.team THEN 1 END) as played_together,
                COUNT(CASE WHEN p1.team = p2.team AND ((p1.team = 'A' AND m.score_team_a > m.score_team_b) OR (p1.team = 'B' AND m.score_team_b > m.score_team_a)) THEN 1 END) as won_together,
                COUNT(CASE WHEN p1.team != p2.team THEN 1 END) as played_against,
                COUNT(CASE WHEN p1.team != p2.team AND ((p1.team = 'A' AND m.score_team_a > m.score_team_b) OR (p1.team = 'B' AND m.score_team_b > m.score_team_a)) THEN 1 END) as won_against,
                COUNT(CASE WHEN p1.team != p2.team AND ((p1.team = 'A' AND m.score_team_a < m.score_team_b) OR (p1.team = 'B' AND m.score_team_b < m.score_team_a)) THEN 1 END) as lost_against
            FROM participants p1
            JOIN participants p2 ON p1.match_id = p2.match_id AND p1.user_id != p2.user_id
            JOIN matches m ON p1.match_id = m.id
            JOIN users u ON p2.user_id = u.id
            WHERE p1.user_id = ?
              AND m.status = 'finished'
              AND p1.status = 'confirmed'
              AND p2.status = 'confirmed'
            GROUP BY p2.user_id, u.username, u.avatar_url
            HAVING played_together >= 3 OR played_against >= 3
        `;

        const [rows] = await db.query(query, [userId]);

        // Calculate Ideal Partner (Best Win Rate Together)
        const partners = rows.filter(r => r.played_together >= 3);
        partners.sort((a, b) => {
            const winRateA = a.won_together / a.played_together;
            const winRateB = b.won_together / b.played_together;
            if (winRateB !== winRateA) {
                return winRateB - winRateA;
            }
            return b.played_together - a.played_together;
        });
        const idealPartner = partners.length > 0 ? partners[0] : null;

        // Calculate Nemesis (Highest Loss Rate Against)
        const opponents = rows.filter(r => r.played_against >= 3);
        opponents.sort((a, b) => {
            const lossRateA = a.lost_against / a.played_against;
            const lossRateB = b.lost_against / b.played_against;
            if (lossRateB !== lossRateA) {
                return lossRateB - lossRateA;
            }
            return b.played_against - a.played_against;
        });
        const nemesis = opponents.length > 0 ? opponents[0] : null;

        // Calculate Favorite Victim (Highest Win Rate Against)
        opponents.sort((a, b) => (b.won_against / b.played_against) - (a.won_against / a.played_against));
        const victim = opponents.length > 0 ? opponents[0] : null;

        res.json({
            idealPartner: idealPartner ? {
                ...idealPartner,
                winRate: Math.round((idealPartner.won_together / idealPartner.played_together) * 100)
            } : null,
            nemesis: nemesis ? {
                ...nemesis,
                lossRate: Math.round((nemesis.lost_against / nemesis.played_against) * 100)
            } : null,
            victim: victim ? {
                ...victim,
                winRate: Math.round((victim.won_against / victim.played_against) * 100)
            } : null
        });

    } catch (error) {
        console.error('Rivals stats error:', error);
        res.status(500).json({ error: 'Server error fetching rivals stats' });
    }
};
