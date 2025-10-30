import pandas as pd

df = pd.read_excel("../data/DES_Data_June_2025.xlsx", header=0)

# Remove rows with missing ParticipantId
cleaned_df = df.dropna(subset=['ParticipantId'])

# Combine Start and End Latitude/Longitude into single columns
cleaned_df['Latitude'] = cleaned_df['StartLatitude'].fillna(cleaned_df['EndLatitude'])
cleaned_df['Longitude'] = cleaned_df['StartLongitude'].fillna(cleaned_df['EndLongitude'])

cleaned_df.rename(columns={'Scared': 'Anxiety'}, inplace=True)

# Select relevant columns
filter_columns = ['Latitude', 'Longitude', 'ActualStartTime', 'Stress', 'Happy', 'Loneliness', 'Anxiety', 'Energy',
                  'EnvInfluence', 'EnvironmentTrigger', 'EnvBeauty', 'EnvInteresting', 'EnvSafety', 'EnvCrowded', 
                  'EnvPersonalSpace', 'EnvironmentGreeness', 'Accepted', 
                  'MovingThroughCity', 'TypeTransportation', 'Weather', 'CurrentPlace']
filtered_df = cleaned_df[filter_columns]


# Convert lat/long to numeric, coerce bad values to NaN
filtered_df[['Latitude', 'Longitude']] = filtered_df[['Latitude', 'Longitude']].apply(
    pd.to_numeric, errors='coerce'
)

# Remove rows with invalid lat/long or non-positive Stress values
filtered_df = filtered_df[filtered_df['Latitude'] != 0.0]
filtered_df = filtered_df[filtered_df['Stress'] > 0]
filtered_df = filtered_df.reset_index(drop=True)

# Correct lat/long values that are likely in microdegrees
filtered_df.loc[filtered_df['Latitude'] > 1000, 'Latitude'] = filtered_df.loc[filtered_df['Latitude'] > 1000, 'Latitude'] / 1000
filtered_df.loc[filtered_df['Longitude'] > 1000, 'Longitude'] = filtered_df.loc[filtered_df['Longitude'] > 1000, 'Longitude'] / 1000

filtered_df.to_csv('../data/emotion_map_cleaned.csv', index=False)