import geopandas as gpd
import pandas as pd
import h3

df = pd.read_csv("../data/stresskarte_cleaned_updated.csv")

lor = gpd.read_file("../data/lor_planungsraeume_2021.geojson") # can also just be the regular berlin boundaries

gdf = gpd.GeoDataFrame(
    df, geometry=gpd.points_from_xy(df.Longitude, df.Latitude), crs="EPSG:4326"
)

gdf = gdf.to_crs(lor.crs)
# Clip the GeoDataFrame to the Berlin boundaries
gdf_berlin = gpd.clip(gdf, lor)

# Assign H3 hex IDs to the GeoDataFrame
resolution = 9
hex_ids = gdf_berlin.apply(lambda row: h3.latlng_to_cell(row.Latitude, row.Longitude, resolution), axis=1)
gdf_berlin_hex = gdf_berlin.assign(hex_id=hex_ids.values)

# Create separate DataFrames for indoors and outdoors locations
#indoors_df = gdf_berlin[gdf_berlin['CurrentPlace'].isin(['Indoors private', 'Indoors public'])]
#outdoors_df = gdf_berlin[gdf_berlin['CurrentPlace'] == 'Outdoors']

variables_to_map = [
    'Stress', 'Happy', 'Loneliness', 'Anxiety', 'Energy', 
    'EnvBeauty', 'EnvInteresting', 'EnvSafety', 'EnvCrowded', 'EnvironmentGreeness',
]

# Aggregate by HEX_ID (mean values)
agg_dict = {var: 'mean' for var in variables_to_map if var in gdf_berlin_hex.columns}
gdf_berlin_by_hex_id = gdf_berlin_hex.groupby("hex_id", as_index=False).agg(agg_dict).round(1)

# Add count of data points per hex_id
gdf_berlin_by_hex_id['DataPointCount'] = gdf_berlin_hex.groupby('hex_id').size().values

gdf_berlin_by_hex_id.to_csv("../data/berlin_emotions_and_environment_by_hex_id_res9.csv", index=False)
