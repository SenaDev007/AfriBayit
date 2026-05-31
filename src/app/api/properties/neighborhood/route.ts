import { NextRequest, NextResponse } from 'next/server';
import { analyzeNeighborhood } from '@/lib/neighborhood';
import { getEnvironmentalData } from '@/lib/environmental';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '6.37');
    const lng = parseFloat(searchParams.get('lng') || '2.39');
    const city = searchParams.get('city') || 'Cotonou';

    const analysis = analyzeNeighborhood(lat, lng, city);
    const environmental = getEnvironmentalData(city);

    return NextResponse.json({
      location: { lat, lng, city },
      walkScore: {
        score: analysis.walkScore.score,
        level: analysis.walkScore.level,
        details: analysis.walkScore.details,
      },
      amenities: {
        totalScore: analysis.amenities.totalScore,
        amenityCount: analysis.amenities.amenityCount,
        varietyScore: analysis.amenities.varietyScore,
        categories: analysis.amenities.categoryScores,
      },
      transport: {
        score: analysis.transport.score,
        level: analysis.transport.level,
        options: analysis.transport.transportOptions,
      },
      safety: analysis.safety,
      overallScore: analysis.overallScore,
      environmental: environmental.weather ? {
        avgTemp: environmental.weather.avgTempC,
        avgRainfall: environmental.weather.avgRainfallMm,
        humidity: environmental.weather.humidityPct,
        airQuality: {
          index: environmental.weather.airQualityIndex,
          level: environmental.weather.airQualityLevel,
        },
        uvIndex: environmental.weather.uvIndex,
        climate: environmental.weather.climate,
        rainySeason: environmental.weather.rainySeason,
        drySeason: environmental.weather.drySeason,
      } : null,
      environmentalNotes: environmental.environmentalNotes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur d\'analyse de quartier';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
