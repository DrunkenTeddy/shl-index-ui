/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { NextSeo } from 'next-seo';
import styled from 'styled-components';
import { PulseLoader } from 'react-spinners';
import Header from '../../components/Header';
import GameDaySchedule from '../../components/GameDaySchedule';
import { Team } from '../..';
import useSchedule from '../../hooks/useSchedule';
import { getQuerySeason } from '../../utils/season';
import TeamSelector, { MinimalTeam } from '../../components/Selector/TeamSelector';
import SeasonTypeSelector from '../../components/Selector/SeasonTypeSelector';
import { SeasonType } from '../api/v1/schedule';

enum SCHEDULE_STATES {
  INITIAL_LOADING = 'INITIAL_LOADING',
  INITIAL_LOADED = 'INITIAL_LOADED',
  FULL_LOADING = 'FULL_LOADING',
  FULL_LOADED = 'FULL_LOADED'
}
type ScheduleState = keyof typeof SCHEDULE_STATES;

const initialNumberOfGames = 32;

interface Props {
  league: string;
  teamlist: Array<Team>;
}

function Schedule({ league, teamlist }: Props): JSX.Element {
  const [scheduleHeight, setScheduleHeight] = useState(0);
  const [scheduleState, setScheduleState] = useState<ScheduleState>('INITIAL_LOADING');
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [filterSeasonType, setFilterSeasonType] = useState('Regular Season');
  const [filterTeam, setFilterTeam] = useState<number>(-1);
  const [isLoadingAssets, setLoadingAssets] = useState<boolean>(true);
  const [sprites, setSprites] = useState<{
    [index: string]: React.ComponentClass<any>;
  }>({});
  const { games, isLoading } = useSchedule(league, filterSeasonType);
  const scheduleContainerRef = useRef();

  useEffect(() => {
    // Dynamically import svg icons based on the league chosen
    (async () => {
      const { default: s } = await import(
        `../../public/team_logos/${league.toUpperCase()}/`
      );

      setSprites(() => s);
      setLoadingAssets(() => false);
    })();
  }, []);

  useEffect(() => {
    if (scheduleContainerRef.current) {
      const containerElem = scheduleContainerRef.current as HTMLElement;
      if (containerElem.clientHeight > scheduleHeight) {
        const newState = (
          scheduleState === SCHEDULE_STATES.INITIAL_LOADING
            ? SCHEDULE_STATES.INITIAL_LOADED
            : SCHEDULE_STATES.FULL_LOADED
        );

        setScheduleState(newState);
        setScheduleHeight(containerElem.clientHeight);
      }
    }
  });

  useEffect(() => {
    const isInitialLoading = scheduleState === SCHEDULE_STATES.INITIAL_LOADING;
    const isFullLoading = scheduleState === SCHEDULE_STATES.FULL_LOADING;

    if (isInitialLoading || isFullLoading) {
      setShowFullSchedule(isFullLoading);
    }
  }, [scheduleState]);

  useEffect(() => {
    setScheduleState(SCHEDULE_STATES.INITIAL_LOADING);
    setScheduleHeight(0);
  }, [filterSeasonType, filterTeam]);

  const onSeasonTypeSelect = async (seasonType: SeasonType) => {
    setScheduleState(SCHEDULE_STATES.INITIAL_LOADING);
    setFilterSeasonType(seasonType);
  };
  const onTeamSelect = (team: MinimalTeam) => setFilterTeam(parseInt(team.id));
  const onLoadAllGames = () => setScheduleState(SCHEDULE_STATES.FULL_LOADING);

  const sortGamesByDate = () => {
    const unsortedGames = [...games];
    return unsortedGames.sort(
      (gameA, gameB) =>
        new Date(gameA.date).valueOf() - new Date(gameB.date).valueOf()
    );
  };

  const hasFilteredTeam = game => filterTeam === -1 || (game.awayTeam === filterTeam || game.homeTeam === filterTeam);

  const getDatesForRendering = (sortedGames) => {
    let gameDates = [];
    sortedGames.forEach(game => {
      if (!gameDates.includes(game.date) && hasFilteredTeam(game)) {
        gameDates.push(game.date);
      }
    });

    if (gameDates.length <= initialNumberOfGames && !showFullSchedule) {
      setShowFullSchedule(true);
    } else if (!showFullSchedule) {
      gameDates = gameDates.slice(0, initialNumberOfGames);
    }

    return gameDates;
  };

  const renderGameDays = () => {
    if (isLoading || isLoadingAssets) return null;

    const gameDaySchedules = [];
    const sortedGames = sortGamesByDate();
    const gameDates = getDatesForRendering(sortedGames);

    gameDates.forEach((date) => {
      const gamesOnDate = sortedGames.filter(game => game.date === date);
      const filteredGamesOnDate = gamesOnDate.filter(game => hasFilteredTeam(game));

      gameDaySchedules.push(
        <GameDaySchedule
          key={date}
          date={date}
          games={filteredGamesOnDate}
          teamlist={teamlist}
          sprites={sprites}
        />
      );
    });

    return gameDaySchedules;
  };

  const isScheduleLoading = scheduleState === SCHEDULE_STATES.INITIAL_LOADING || scheduleState === SCHEDULE_STATES.FULL_LOADING;

  return (
    <React.Fragment>
      <NextSeo
        title="Schedule"
        openGraph={{
          title: 'Schedule',
        }}
      />
      <Header league={league} activePage="schedule" />
      <Container>
        <Filters>
          <SeasonTypeSelector onChange={onSeasonTypeSelect} />
          <TeamSelector teams={teamlist} onChange={onTeamSelect} />
        </Filters>
        <ScheduleContainer ref={scheduleContainerRef}>{renderGameDays()}</ScheduleContainer>
        <LoadingWrapper>
          {isScheduleLoading && <PulseLoader size={15} />}
          {!isScheduleLoading && !showFullSchedule && <LoadAllButton onClick={onLoadAllGames}>Load all games</LoadAllButton>}
        </LoadingWrapper>
      </Container>
    </React.Fragment>
  );
}

const Container = styled.div`
  width: 75%;
  padding: 41px 0 40px 0;
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.grey100};

  @media screen and (max-width: 1024px) {
    width: 100%;
    padding: 2.5%;
  }
`;

const Filters = styled.div`
  display: flex;
  flex-direction: row;
  margin-right: 4%;
  justify-content: flex-end;

  button {
    width: 225px;
    margin-right: 10px;
  }

  @media screen and (max-width: 750px) {
    flex-direction: column;
    align-items: center;

    button {
      margin-right: 0;
      margin-bottom: 5px;
    }
  }
`;

const ScheduleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  width: 95%;
  margin: 0 auto 40px;
  flex-wrap: wrap;
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadAllButton = styled.button`
  display: inline-block;
  padding: 8px 20px;
  border: 1px solid ${({ theme }) => theme.colors.grey500};
  background-color: ${({ theme }) => theme.colors.grey100};
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.grey300};
  }

  &:active {
    background-color: ${({ theme }) => theme.colors.grey200};
  }
`;

export const getStaticPaths: GetStaticPaths = async () => {
  const leagues = ['shl', 'smjhl', 'iihf', 'wjc'];

  const paths = leagues.map((league) => ({
    params: { league },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { league: leaguename } = ctx.params;
  const leagueid = ['shl', 'smjhl', 'iihf', 'wjc'].indexOf(
    typeof leaguename === 'string' ? leaguename : 'shl'
  );
  const season = getQuerySeason();
  const seasonParam = season ? `&season=${season}` : '';

  const teamlist = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/v1/teams?league=${leagueid}${seasonParam}`
  ).then((res) => res.json());

  return { props: { league: ctx.params.league, teamlist } };
};

export default Schedule;
