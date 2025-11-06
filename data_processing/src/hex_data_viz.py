import h3
import pandas as pd
import folium
from folium.plugins import GroupedLayerControl
import branca.colormap as cm
from shapely.geometry import shape
from geojson import Feature
import argparse


def create_toggleable_hex_circle_map(file_path, center_location=[52.5200, 13.4050], tileset="cartodbdarkmatter", zoom_start=11, zoom_control=False):
    """
    Create a toggleable hexagon circle map.
    """
    agg_df = pd.read_csv(file_path)
    # Center on Berlin
    m = folium.Map(location=center_location, zoom_start=zoom_start, tiles=tileset, zoom_control=zoom_control)

    max_count = agg_df['DataPointCount'].max()
    min_count = agg_df['DataPointCount'].min()
    
    emotional_vars = ['Stress', 'Happy', 'Loneliness', 'Anxiety', 'Energy']
    emotion_colormaps = {
        'Stress': cm.linear.Reds_09,
        'Happy': cm.linear.Greens_09,
        'Loneliness': cm.linear.Blues_09,
        'Anxiety': cm.linear.Oranges_09,
        'Energy': cm.linear.YlOrRd_09
    }
    emotion_layers = []
    base_radius = 20  # minimum radius in meters
    max_additional_radius = 100  # maximum additional radius
    for emotion in emotional_vars:
        if emotion not in agg_df.columns or agg_df[emotion].isna().all():
            continue

        # Create FeatureGroup for this emotion
        fg = folium.FeatureGroup(name=emotion, overlay=False)

        colormap = emotion_colormaps[emotion].scale(1, 5).to_step(5)

        for idx, row in agg_df.iterrows():
            hex_id = row['hex_id']
            participant_count = row['DataPointCount']

            # Get hexagon center coordinates
            geometry_for_row = h3.cells_to_geo([hex_id])
            polygon_shape = shape(geometry_for_row)  # Convert to shapely polygon
            centroid = polygon_shape.centroid
            center_lat, center_lng = centroid.y, centroid.x
            
            # Scale circle radius based on participant count
            normalized_count = (participant_count - min_count) / (max_count - min_count)
            radius = base_radius + (normalized_count * max_additional_radius)

            circle = folium.Circle(
                location=[center_lat, center_lng],
                radius=radius,
                color=None,
                weight=1,
                fill=True,
                fillColor='white',
                fillOpacity=0.6,
                tooltip=f'Participants: {participant_count}'
            )
     
            circle.add_to(fg)

            # Add hexagons
            hexagon = folium.GeoJson(
                Feature(
                    geometry = geometry_for_row, 
                    id=hex_id, 
                    properties = {emotion : row[emotion]}
                ),
                marker=folium.Circle(radius=0, fill=False),
                style_function=lambda feature, e=emotion, cmap=colormap: {
                    'fillColor': cmap(feature['properties'].get(e, 1)),
                    'color': None,
                    'weight': 2,
                    'fillOpacity': 0.6, 
                },
                tooltip=f'Participants: {participant_count}'
            )

            hexagon.add_to(fg)

            
        fg.add_to(m)
        emotion_layers.append(fg)


   
    # Create first GroupedLayerControl for emotions
    GroupedLayerControl(
        groups={
            'Emotions': emotion_layers,
        },
        collapsed=False,
        exclusive_groups=True,
        position='topright'
    ).add_to(m)

    m.save('hex_circle_map.html')
    print("Map saved to hex_circle_map.html")

    return m

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate toggleable hex circle map from CSV.")
    parser.add_argument("file_path", help="Path to CSV file containing aggregated data.")
    args = parser.parse_args()
    create_toggleable_hex_circle_map(args.file_path)
