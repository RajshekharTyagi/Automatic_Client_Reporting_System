import axios from 'axios';

/**
 * Utility functions for interacting with Hugging Face Inference API
 */

// Get API key from environment variables with fallback for development
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || 'dummy-key-for-development';

/**
 * Call Hugging Face Inference API for text summarization
 * @param {string} text - The text to summarize
 * @returns {Promise<string>} - The summarized text
 */
export const summarizeText = async (text) => {
  // For development/demo purposes, return mock data if API key is not set
  if (HF_API_KEY === 'dummy-key-for-development') {
    console.log('Using mock data for summarization');
    return `This is a mock summary of the text. The original content was about ${text.substring(0, 50)}... (${text.length} characters)`;
  }
  
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data && response.data[0] && response.data[0].summary_text) {
      return response.data[0].summary_text;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error calling Hugging Face API:', error);
    // Fallback to mock data in case of error for better browser compatibility
    console.log('Falling back to mock data due to API error');
    return `This is a mock summary of the text. The original content was about ${text.substring(0, 50)}... (${text.length} characters)`;
  }
};

/**
 * Call Hugging Face Inference API for question answering
 * @param {string} context - The context text (document content)
 * @param {string} question - The question to answer
 * @returns {Promise<Object>} - The answer object with text and score
 */
export const answerQuestion = async (context, question) => {
  // For development/demo purposes, return mock data if API key is not set
  if (HF_API_KEY === 'dummy-key-for-development') {
    console.log('Using mock data for question answering');
    return {
      answer: `Mock answer to the question: "${question}"`,
      score: 0.95,
      start: 0,
      end: 10
    };
  }
  
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2',
      {
        inputs: {
          question: question,
          context: context
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error calling Hugging Face QA API:', error);
    // Fallback to mock data in case of error for better browser compatibility
    console.log('Falling back to mock data due to API error');
    return {
      answer: `Mock answer to the question: "${question}"`,
      score: 0.95,
      start: 0,
      end: 10
    };
  }
};

/**
 * Extract insights from text using Hugging Face API
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} - Extracted insights
 */
export const extractInsights = async (text) => {
  // For development/demo purposes, return mock data if API key is not set
  if (HF_API_KEY === 'dummy-key-for-development') {
    console.log('Using mock data for insights extraction');
    return getMockInsights(text);
  }
  
  // First get a summary
  const summary = await summarizeText(text);
  
  // Then extract some key insights by asking specific questions
  const questions = [
    'What are the main metrics or KPIs mentioned?',
    'What trends or patterns are identified?',
    'What are the key recommendations or actions?'
  ];
  
  const insights = {};
  
  try {
    // Process questions in parallel
    const answers = await Promise.all(
      questions.map(question => answerQuestion(text, question))
    );
    
    insights.metrics = answers[0]?.answer || 'No specific metrics identified';
    insights.trends = answers[1]?.answer || 'No clear trends identified';
    insights.actions = answers[2]?.answer || 'No specific actions recommended';
    insights.summary = summary;
    
    return insights;
  } catch (error) {
    console.error('Error extracting insights:', error);
    // Fallback to mock data in case of error
    console.log('Falling back to mock insights due to API error');
    return getMockInsights(text);
  }
};

/**
 * Extract metrics from text (numbers, percentages, dates, currencies)
 * @param {string} text - The text to extract metrics from
 * @returns {Array} - Extracted metrics
 */
const extractMetrics = (text) => {
  const metrics = [];
  
  // Extract percentages (e.g., 15%, 3.5%)
  const percentageRegex = /(\d+(\.\d+)?\s*%)/g;
  const percentages = text.match(percentageRegex) || [];
  percentages.forEach(percentage => {
    metrics.push({
      type: 'percentage',
      value: percentage.trim(),
      context: getContext(text, percentage)
    });
  });
  
  // Extract currencies (e.g., $100, €50, £25)
  const currencyRegex = /([\$€£]\s*\d+([,\.]\d+)*)/g;
  const currencies = text.match(currencyRegex) || [];
  currencies.forEach(currency => {
    metrics.push({
      type: 'currency',
      value: currency.trim(),
      context: getContext(text, currency)
    });
  });
  
  // Extract dates (simple format: YYYY-MM-DD)
  const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
  const dates = text.match(dateRegex) || [];
  dates.forEach(date => {
    metrics.push({
      type: 'date',
      value: date.trim(),
      context: getContext(text, date)
    });
  });
  
  // Extract standalone numbers (not part of percentages or currencies)
  const numberRegex = /(?<!\d|\.|\$|€|£|%)\b\d+([,\.]\d+)*\b(?!\s*%)/g;
  const numbers = text.match(numberRegex) || [];
  numbers.forEach(number => {
    metrics.push({
      type: 'number',
      value: number.trim(),
      context: getContext(text, number)
    });
  });
  
  return metrics;
};

/**
 * Get context around a matched term
 * @param {string} text - The full text
 * @param {string} match - The matched term
 * @returns {string} - Context snippet
 */
const getContext = (text, match) => {
  const index = text.indexOf(match);
  if (index === -1) return '';
  
  // Get 30 characters before and after the match
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + match.length + 30);
  
  return text.substring(start, end).trim();
};

/**
 * Generate mock insights for development/demo purposes
 * @param {string} text - The text content
 * @returns {Object} - Mock insights
 */
const getMockInsights = (text) => {
  // Extract some basic metrics for the mock data
  const metrics = extractMetrics(text);
  
  return {
    summary: `This is a mock summary of the document. The content contains approximately ${text.length} characters and appears to discuss business metrics, performance indicators, and strategic planning.`,
    metrics: metrics.length > 0 ? metrics : [
      { type: 'percentage', value: '15%', context: 'growth rate' },
      { type: 'currency', value: '$250,000', context: 'revenue' },
      { type: 'number', value: '42', context: 'new clients' },
      { type: 'date', value: '2023-12-15', context: 'project deadline' }
    ],
    trends: [
      'Mock trend 1: Consistent growth in quarterly revenue over the past year.',
      'Mock trend 2: Customer acquisition costs have decreased while retention rates improved.',
      'Mock trend 3: Market share has expanded in the western region but remained flat in other areas.'
    ],
    actions: [
      'Mock recommendation 1: Increase investment in the western region marketing campaigns.',
      'Mock recommendation 2: Implement the customer loyalty program to further improve retention.',
      'Mock recommendation 3: Evaluate pricing strategy for eastern markets to improve penetration.'
    ]
  };
};