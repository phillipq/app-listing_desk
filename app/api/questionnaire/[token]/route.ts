import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: _token } = await params
    
    // Model for questionnaire storage does not exist; return a generic questionnaire template
    return NextResponse.json({
      questionnaire: {
        id: null,
        realtorName: null,
        realtorDomain: null,
        status: 'pending',
        initialInterests: [],
        questions: getQuestionnaireQuestions()
      }
    })
    
  } catch (error) {
    console.error('Error fetching questionnaire:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire', details: message },
      { status: 500 }
    )
  }
}

// Helper function to get questionnaire questions
function getQuestionnaireQuestions() {
  return [
    {
      id: 'family_situation',
      question: 'What best describes your family situation?',
      type: 'radio',
      options: [
        { value: 'single', label: 'Single' },
        { value: 'couple', label: 'Couple' },
        { value: 'young_children', label: 'Young children (under 12)' },
        { value: 'teenagers', label: 'Teenagers (12-18)' },
        { value: 'adult_children', label: 'Adult children' },
        { value: 'empty_nesters', label: 'Empty nesters' }
      ]
    },
    {
      id: 'daily_routine',
      question: 'How would you describe your daily routine?',
      type: 'radio',
      options: [
        { value: 'flexible', label: 'Flexible schedule' },
        { value: 'traditional_9to5', label: 'Traditional 9-5 work' },
        { value: 'shift_work', label: 'Shift work' },
        { value: 'work_from_home', label: 'Work from home' },
        { value: 'retired', label: 'Retired' }
      ]
    },
    {
      id: 'lifestyle_priorities',
      question: 'What are your top lifestyle priorities? (Select all that apply)',
      type: 'checkbox',
      options: [
        { value: 'fitness', label: 'Fitness & Recreation' },
        { value: 'dining', label: 'Dining & Entertainment' },
        { value: 'shopping', label: 'Shopping & Convenience' },
        { value: 'education', label: 'Education & Schools' },
        { value: 'healthcare', label: 'Healthcare Access' },
        { value: 'transportation', label: 'Public Transportation' },
        { value: 'community', label: 'Community & Social Life' }
      ]
    },
    {
      id: 'transportation',
      question: 'How do you typically get around?',
      type: 'radio',
      options: [
        { value: 'car_primary', label: 'Car (primary mode)' },
        { value: 'transit_primary', label: 'Public transit (primary mode)' },
        { value: 'walking_cycling', label: 'Walking/Cycling' },
        { value: 'mixed', label: 'Mixed (car + transit)' }
      ]
    },
    {
      id: 'work_location',
      question: 'Where do you work?',
      type: 'radio',
      options: [
        { value: 'downtown', label: 'Downtown/City center' },
        { value: 'suburbs', label: 'Suburbs' },
        { value: 'remote', label: 'Remote/Work from home' },
        { value: 'flexible', label: 'Flexible location' },
        { value: 'retired', label: 'Retired' }
      ]
    },
    {
      id: 'budget_considerations',
      question: 'What transportation costs are you most concerned about?',
      type: 'checkbox',
      options: [
        { value: 'gas_costs', label: 'Gas costs' },
        { value: 'parking', label: 'Parking fees' },
        { value: 'transit_passes', label: 'Transit passes' },
        { value: 'vehicle_maintenance', label: 'Vehicle maintenance' },
        { value: 'low_transportation', label: 'Low transportation costs overall' }
      ]
    },
    {
      id: 'future_plans',
      question: 'What are your future plans? (Select all that apply)',
      type: 'checkbox',
      options: [
        { value: 'starting_family', label: 'Starting a family' },
        { value: 'growing_family', label: 'Growing family' },
        { value: 'career_change', label: 'Career change' },
        { value: 'retirement', label: 'Planning for retirement' },
        { value: 'downsizing', label: 'Downsizing' },
        { value: 'upsizing', label: 'Upsizing' }
      ]
    }
  ]
}
