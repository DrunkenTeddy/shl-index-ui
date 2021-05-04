#! /usr/bin/env python3
from dotenv import dotenv_values
import json
import mysql.connector
from pathlib import Path
from mysql.connector import cursor
import requests


class YoutubeInfoUpdater():
    """
    The YoutubeInfoUpdater allows a user to get the most up to date youtube video
    ids and save them to a database.
    """
    def __init__(self, env_file_path=None):
        self.__env_file_path = env_file_path

        # set the env_file_path to the default if none is given.
        if self.__env_file_path is None:
            env_path = Path(__file__).absolute().parent.parent.parent.parent
            self.__env_file_path = env_path.joinpath('.env.local').absolute()

        # private league dictionary
        self.__leagues = dict()

        # private database variables
        self.__mysql_connection = None
        self.__mysql_host = None
        self.__mysql_database = None
        self.__mysql_user = None
        self.__mysql_password = None

        # private api variables
        self.__youtube_api_key = None
        self.__shl_channel_id = None
        self.__smjhl_channel_id = None
        self.__wjc_channel_id = None
        self.__iihf_channel_id = None
        self.__google_api_url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date&maxResults=1'

        self.set_database_information()
        self.set_api_url()
        self.set_leagues()

# API functions

    def get_video_info(self, league: str):
        """
        Gets the video ID for the specified league.
        """
        league_id = self.__leagues[league.lower()]
        response = requests.get(f'{self.__google_api_url}&channelId={league_id}')
        response_payload = response.json()

        if response.status_code == 403 and 'quota' in response_payload['error']['message']:
            raise Exception(f'Failed to get video id because quota exceeded.')
        elif response.status_code != 200:
            raise Exception(f'Failed to get video id for league [{league}]. Unknown error.')

        return (response_payload['data']['id']['videoId'], response_payload['data']['snippet']['liveBroadcastContent'])
    
    def set_api_url(self):
        """
        Sets the api url.
        """
        self.__google_api_url = f'{self.__google_api_url}&key={self.__youtube_api_key}'

    def set_leagues(self):
        """
        Sets the league dictionary.
        """
        self.__leagues = {
            'shl': self.__shl_channel_id,
            'smjhl': self.__smjhl_channel_id,
            'wjc': self.__wjc_channel_id,
            'iihf': self.__iihf_channel_id
        }

# database functions

    def set_database_information(self):
        """
        Sets the data base information from a .env.local file in the path given.
        """
        config = dotenv_values(self.__env_file_path)
        self.__mysql_host = config['MYSQL_HOST']
        self.__mysql_database = config['MYSQL_DATABASE']
        self.__mysql_user = config['MYSQL_USER']
        self.__mysql_password = config['MYSQL_PASSWORD']
        self.__youtube_api_key = config['NEXT_PUBLIC_YOUTUBE_API_KEY']
        self.__shl_channel_id = config['NEXT_PUBLIC_SHL_CHANNEL_ID']
        self.__smjhl_channel_id = config['NEXT_PUBLIC_SMJHL_CHANNEL_ID']
        self.__wjc_channel_id = config['NEXT_PUBLIC_SMJHL_CHANNEL_ID']
        self.__iihf_channel_id = config['NEXT_PUBLIC_SMJHL_CHANNEL_ID']

    def connect_to_database(self):
        """
        Connect to the database.
        """
        self.__mysql_connection = mysql.connector.connect(
            host=self.__mysql_host,
            user=self.__mysql_user,
            password=self.__mysql_password,
            database=self.__mysql_database
        )

    def select_all(self):
        """
        Select all from the database table.
        """
        cursor = self.__mysql_connection.cursor()
        cursor.execute('SELECT * FROM youtube_data')
        result = cursor.fetchall()
        return result

    def update_league(self, league, video_info):
        """
        Update a league in the database to a new video id.
        """
        # separate the tuple to get the individual elements
        video_id = video_info[0]
        video_is_live = video_info[1]

        cursor = self.__mysql_connection.cursor()
        statement = f"UPDATE youtube_data "
        statement = statement + f"SET videoID = '{video_id}', isLive = '{video_is_live}' "
        statement = statement + f"WHERE league = '{league.lower()}'"
        cursor.execute(statement)

        self.__mysql_connection.commit()

        print(f'leage [{league}] updated to video id [{video_id}] if it exists.')

# setters/getters

    def set_env_file_path(self, env_file_path):
        """
        Sets the env_file_path.
        """
        self.__env_file_path = env_file_path

    def get_env_file_path(self):
        """
        Returns the env_file_path.
        """
        return self.__env_file_path

# testing functions

    def run_test(self, *args):
        """
        Function to run tests on the class
        """
        self.__insert_row(args[0], args[1])

if __name__ == '__main__':
    video_updater = YoutubeInfoUpdater()
    video_updater.connect_to_database()

    league_data = {
        'shl'  : video_updater.get_video_info('shl'),
        'smjhl': video_updater.get_video_info('smjhl'),
        'wjc'  : video_updater.get_video_info('wjc'),
        'iihf' : video_updater.get_video_info('iihf')
    }
    
    # update all the leagues
    for league in ['shl', 'smjhl', 'wjc', 'iihf']:
        video_updater.update_league(league, league_data[league])

    final_tables = json.dumps(video_updater.select_all(), indent=2)

    # print out results
    print('Update complete.')
    print(final_tables)
