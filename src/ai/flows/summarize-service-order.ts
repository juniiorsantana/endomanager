'use server';

/**
 * @fileOverview Summarizes a service order using AI, highlighting key details from technician notes and inspection checklists.
 *
 * - summarizeServiceOrder - A function that takes service order details as input and returns a summarized report.
 * - SummarizeServiceOrderInput - The input type for the summarizeServiceOrder function.
 * - SummarizeServiceOrderOutput - The return type for the summarizeServiceOrder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeServiceOrderInputSchema = z.object({
  technicianNotes: z.string().describe('Technician\u2019s detailed notes on the service order.'),
  inspectionChecklist: z.string().describe('Checklist of inspected items with their status.'),
});

export type SummarizeServiceOrderInput = z.infer<
  typeof SummarizeServiceOrderInputSchema
>;

const SummarizeServiceOrderOutputSchema = z.object({
  summary: z.string().describe('AI-generated summary of the service order.'),
});

export type SummarizeServiceOrderOutput = z.infer<
  typeof SummarizeServiceOrderOutputSchema
>;

export async function summarizeServiceOrder(
  input: SummarizeServiceOrderInput
): Promise<SummarizeServiceOrderOutput> {
  return summarizeServiceOrderFlow(input);
}

const summarizeServiceOrderPrompt = ai.definePrompt({
  name: 'summarizeServiceOrderPrompt',
  input: {schema: SummarizeServiceOrderInputSchema},
  output: {schema: SummarizeServiceOrderOutputSchema},
  prompt: `You are an AI assistant that summarizes service orders.

  Summarize the key details from the technician's notes and inspection checklist provided below.
  Focus on important findings and the overall status of the service order.

  Technician Notes: {{{technicianNotes}}}

  Inspection Checklist: {{{inspectionChecklist}}}
  `,
});

const summarizeServiceOrderFlow = ai.defineFlow(
  {
    name: 'summarizeServiceOrderFlow',
    inputSchema: SummarizeServiceOrderInputSchema,
    outputSchema: SummarizeServiceOrderOutputSchema,
  },
  async input => {
    const {output} = await summarizeServiceOrderPrompt(input);
    return output!;
  }
);
