// Debugging utility for Edge Functions
// This helps diagnose issues with the analytics Edge Functions

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

interface EdgeFunctionDebugResult {
  functionName: string;
  status: 'success' | 'error';
  statusCode?: number;
  data?: any;
  error?: string;
  timing: number;
  rawResponse?: string;
}

export class EdgeFunctionDebugger {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Test a single Edge Function
  async testFunction(
    functionName: string,
    payload: any
  ): Promise<EdgeFunctionDebugResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Testing ${functionName}...`);
      console.log('Payload:', payload);

      const { data, error } = await this.supabase.functions.invoke(functionName, {
        body: payload,
      });

      const timing = Date.now() - startTime;

      if (error) {
        console.error(`❌ ${functionName} error:`, error);
        
        // Try to extract more error details
        let statusCode = 500;
        let errorDetails = error.message;
        
        if (error.context?.status) {
          statusCode = error.context.status;
        }
        
        if (error.context?.response) {
          try {
            const responseText = await error.context.response.text();
            errorDetails = `${error.message}\nResponse: ${responseText}`;
          } catch (e) {
            // Ignore if we can't read the response
          }
        }

        return {
          functionName,
          status: 'error',
          statusCode,
          error: errorDetails,
          timing,
        };
      }

      console.log(`✅ ${functionName} success:`, data);
      
      return {
        functionName,
        status: 'success',
        statusCode: 200,
        data,
        timing,
      };
    } catch (error) {
      console.error(`💥 ${functionName} exception:`, error);
      
      return {
        functionName,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: Date.now() - startTime,
      };
    }
  }

  // Test all analytics functions
  async testAllAnalyticsFunctions(): Promise<EdgeFunctionDebugResult[]> {
    const testCases = [
      {
        functionName: 'fetch-youtube-analytics',
        payload: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      },
      {
        functionName: 'fetch-instagram-analytics',
        payload: { url: 'https://www.instagram.com/p/C1234567890/' },
      },
      {
        functionName: 'fetch-tiktok-analytics',
        payload: { url: 'https://www.tiktok.com/@test/video/1234567890' },
      },
    ];

    console.log('🚀 Starting Edge Functions diagnostic test...');
    console.log('=======================================\n');

    const results = [];
    
    for (const testCase of testCases) {
      const result = await this.testFunction(testCase.functionName, testCase.payload);
      results.push(result);
      console.log('\n---\n');
    }

    // Summary
    console.log('📋 Test Summary:');
    console.log('===============');
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n🔍 Failed functions:');
      results
        .filter(r => r.status === 'error')
        .forEach(r => {
          console.log(`- ${r.functionName}: ${r.error}`);
        });
    }

    return results;
  }

  // Test with real URLs
  async testWithRealUrls(urls: { youtube?: string; instagram?: string; tiktok?: string }) {
    console.log('🎯 Testing with real URLs...');
    console.log('========================\n');

    const results = [];

    if (urls.youtube) {
      const result = await this.testFunction('fetch-youtube-analytics', { url: urls.youtube });
      results.push(result);
    }

    if (urls.instagram) {
      const result = await this.testFunction('fetch-instagram-analytics', { url: urls.instagram });
      results.push(result);
    }

    if (urls.tiktok) {
      const result = await this.testFunction('fetch-tiktok-analytics', { url: urls.tiktok });
      results.push(result);
    }

    return results;
  }

  // Generate diagnostic report
  generateReport(results: EdgeFunctionDebugResult[]): string {
    const report = [];
    
    report.push('# Edge Functions Diagnostic Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');
    
    report.push('## Environment');
    report.push(`- Supabase URL: ${supabaseUrl}`);
    report.push(`- Has Anon Key: ${!!supabaseAnonKey}`);
    report.push('');
    
    report.push('## Test Results');
    
    for (const result of results) {
      report.push(`### ${result.functionName}`);
      report.push(`- Status: ${result.status}`);
      report.push(`- Status Code: ${result.statusCode || 'N/A'}`);
      report.push(`- Response Time: ${result.timing}ms`);
      
      if (result.error) {
        report.push(`- Error: ${result.error}`);
      }
      
      if (result.data) {
        report.push(`- Data: ${JSON.stringify(result.data, null, 2)}`);
      }
      
      report.push('');
    }
    
    report.push('## Recommendations');
    
    const hasErrors = results.some(r => r.status === 'error');
    if (hasErrors) {
      report.push('1. Check Edge Function logs: `supabase functions logs [function-name] --tail`');
      report.push('2. Verify API keys are set: `supabase secrets list`');
      report.push('3. Ensure functions are deployed: `supabase functions deploy`');
      report.push('4. Check CORS configuration in Edge Functions');
    } else {
      report.push('✅ All functions are working correctly!');
    }
    
    return report.join('\n');
  }
}

// Export singleton instance
export const edgeFunctionDebugger = new EdgeFunctionDebugger();

// Browser console helper
if (typeof window !== 'undefined') {
  (window as any).debugEdgeFunctions = async () => {
    const debuggerInstance = new EdgeFunctionDebugger();
    const results = await debuggerInstance.testAllAnalyticsFunctions();
    const report = debuggerInstance.generateReport(results);
    console.log(report);
    return results;
  };
  
  console.log('🎆 Edge Function Debugger loaded!');
  console.log('Run `debugEdgeFunctions()` in the console to test all functions.');
}