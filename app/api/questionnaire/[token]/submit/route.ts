import { NextRequest, NextResponse } from 'next/server'
// No DB writes for questionnaire submission; storing is not supported currently

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: _token } = await params
    const { responses } = await request.json() as { responses?: Record<string, string | string[]> }
    if (!responses) {
      return NextResponse.json({ error: 'Responses are required' }, { status: 400 })
    }
    
    // Process responses and generate categories
    const selectedCategories = generateCategoriesFromResponses(responses)

    return NextResponse.json({
      success: true,
      message: 'Questionnaire completed successfully!',
      selectedCategories,
      questionnaireId: null
    })
    
  } catch (error) {
    console.error('Error submitting questionnaire:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to submit questionnaire', details: message },
      { status: 500 }
    )
  }
}

// Helper function to generate amenity categories based on responses
function generateCategoriesFromResponses(responses: Record<string, string | string[]>): string[] {
  const categories: string[] = []
  
  // Family situation mapping
  if (responses.family_situation === 'young_children' || responses.family_situation === 'teenagers') {
    categories.push('schools', 'daycare', 'parks')
  }
  
  if (responses.family_situation === 'young_children') {
    categories.push('daycare', 'playgrounds')
  }
  
  // Lifestyle priorities mapping
  if (responses.lifestyle_priorities?.includes('fitness')) {
    categories.push('gyms', 'fitness', 'recreation')
  }
  
  if (responses.lifestyle_priorities?.includes('dining')) {
    categories.push('restaurants', 'dining')
  }
  
  if (responses.lifestyle_priorities?.includes('shopping')) {
    categories.push('shopping', 'malls', 'grocery')
  }
  
  if (responses.lifestyle_priorities?.includes('education')) {
    categories.push('schools', 'universities', 'libraries')
  }
  
  if (responses.lifestyle_priorities?.includes('healthcare')) {
    categories.push('hospitals', 'pharmacies', 'healthcare')
  }
  
  if (responses.lifestyle_priorities?.includes('transportation')) {
    categories.push('transit_stations', 'bus_stops')
  }
  
  // Transportation mapping
  if (responses.transportation === 'car_primary') {
    categories.push('gas_stations', 'auto_repair', 'parking')
  }
  
  if (responses.transportation === 'transit_primary' || responses.transportation === 'mixed') {
    categories.push('transit_stations', 'bus_stops')
  }
  
  if (responses.transportation === 'walking_cycling') {
    categories.push('walkability', 'bike_paths', 'parks')
  }
  
  // Work location mapping
  if (responses.work_location === 'downtown') {
    categories.push('transit_stations', 'coffee', 'lunch_spots')
  }
  
  // Future plans mapping
  if (responses.future_plans?.includes('starting_family') || responses.future_plans?.includes('growing_family')) {
    categories.push('schools', 'daycare', 'parks', 'family_services')
  }
  
  if (responses.future_plans?.includes('retirement')) {
    categories.push('healthcare', 'recreation', 'senior_services')
  }
  
  // Remove duplicates and return
  return categories.filter((value, index, self) => self.indexOf(value) === index)
}
