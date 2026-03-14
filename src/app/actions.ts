"use server";

import { aidPolicyCreation, AidPolicyCreationInput, AidPolicyCreationOutput } from '@/ai/flows/ai-policy-creation';
import { z } from 'zod';

const ActionInputSchema = z.object({
  description: z.string().min(10, "Please provide a more detailed description."),
});

export async function generatePolicySuggestions(prevState: any, formData: FormData) {
  const validatedFields = ActionInputSchema.safeParse({
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
      suggestions: [],
    };
  }

  try {
    const result = await aidPolicyCreation({ description: validatedFields.data.description });
    if (!result.suggestedPolicies || result.suggestedPolicies.length === 0) {
      return {
        message: 'The AI could not generate suggestions for this description. Please try a different approach.',
        errors: null,
        suggestions: [],
      };
    }
    return { message: 'success', errors: null, suggestions: result.suggestedPolicies };
  } catch (error) {
    console.error('Error generating policy suggestions:', error);
    return {
      message: 'An unexpected error occurred while contacting the AI. Please try again later.',
      errors: null,
      suggestions: [],
    };
  }
}
