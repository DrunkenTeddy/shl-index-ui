import React from 'react';
import RatingsTable from '.';
import { GoalieRatings } from '../..';

interface Props {
  data: Array<GoalieRatings>;
}

function GoalieRatingsTable({ data: players }: Props): JSX.Element {

  const columnData = [
    {
      Header: 'Player Info',
      id: 'player-table-basic-info',
      columns: [
        {
          Header: 'Player',
          id: 'player-table-player',
          accessor: 'name',
          // Create cell which contains link to player
        },
        {
          Header: 'Team',
          accessor: 'team',
          title: 'Team',
        },
      ],
    },
    {
      Header: 'Goalie',
      id: 'goalie-ratings',
      columns: [
        {
          Header: 'BLO',
          accessor: 'blocker',
          title: 'Blocker',
          sortDescFirst: true
        },
        {
          Header: 'GLO',
          accessor: 'glove',
          title: 'Glove',
          sortDescFirst: true
        },
        {
          Header: 'PAS',
          accessor: 'passing',
          title: 'Passing',
          sortDescFirst: true
        },
        {
          Header: 'POK',
          accessor: 'pokeCheck',
          title: 'Poke Check',
          sortDescFirst: true
        },
        {
          Header: 'POS',
          accessor: 'positioning',
          title: 'Positioning',
          sortDescFirst: true
        },
        {
          Header: 'REB',
          accessor: 'rebound',
          title: 'Rebound',
          sortDescFirst: true
        },
        {
          Header: 'REC',
          accessor: 'recovery',
          title: 'Recovery',
          sortDescFirst: true
        },
        {
          Header: 'PHA',
          accessor: 'puckhandling',
          title: 'Puckhandling',
          sortDescFirst: true
        },
        {
          Header: 'LOW',
          accessor: 'lowShots',
          title: 'Low Shots',
          sortDescFirst: true
        },
        {
          Header: 'REF',
          accessor: 'reflexes',
          title: 'Reflexes',
          sortDescFirst: true
        },
        {
          Header: 'SKA',
          accessor: 'skating',
          title: 'Skating',
          sortDescFirst: true
        },
      ],
    },
    {
      Header: 'Mental',
      id: 'goalie-mental',
      columns: [
        {
          Header: 'MTO',
          accessor: 'mentalToughness',
          title: 'Mental Toughness',
          sortDescFirst: true
        },
        {
          Header: 'GST',
          accessor: 'goalieStamina',
          title: 'Goalie Stamina',
          sortDescFirst: true
        },
      ],
    },
  ];

  return <RatingsTable data={players} columnData={columnData}/>;
}

export default GoalieRatingsTable;