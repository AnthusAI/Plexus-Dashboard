import { generateClient } from 'aws-amplify/api';
import { Schema } from '@/amplify/data/resource';

const dataClient = generateClient<Schema>();

export { dataClient }

type ModelName = keyof Schema;
type ModelType<T extends ModelName> = Schema[T]['type'];

interface GraphQLError {
  message: string;
  path?: (string | number)[];
  locations?: { line: number; column: number; }[] | null;
}

export async function listFromModel<T extends ModelName>(
  modelName: T,
  options?: {
    filter?: Record<string, { eq?: unknown }>,
    limit?: number,
    nextToken?: string
  }
) {
  try {
    console.log('Listing from model:', { modelName, ...options });
    // @ts-ignore - Amplify Gen2 typing issue
    const response = await dataClient.models[modelName].list(options);
    
    // Log full API response structure and any errors
    console.log('Full API response:', {
      hasData: !!response.data,
      dataLength: response.data?.length,
      nextToken: response.nextToken,
      hasErrors: !!response.errors,
      errorCount: response.errors?.length,
      responseKeys: Object.keys(response)
    });

    if (response.errors?.length) {
      // Group errors by record index
      const errorsByIndex = response.errors.reduce((acc: Record<number, string[]>, error: GraphQLError) => {
        const index = error.path?.[2];
        if (typeof index === 'number') {
          if (!acc[index]) acc[index] = [];
          acc[index].push(error.message);
        }
        return acc;
      }, {});
      
      console.log('Errors by record:', errorsByIndex);
    }

    // Map nulled records back to their original data where possible
    const reconstructedData = response.data?.map((item: unknown, index: number) => {
      if (item === null && response.errors) {
        // Find the original data from the error paths
        const recordErrors = response.errors.filter((e: GraphQLError) => e.path?.[2] === index);
        if (recordErrors.length > 0) {
          // This was a valid record that got nulled due to missing required fields
          return {
            __partial: true, // Mark as partial data
            id: `partial-${index}`, // Generate a temporary ID
            createdAt: new Date().toISOString(), // Use current time as fallback
            ...Object.fromEntries(
              recordErrors.map((e: GraphQLError) => [
                e.path?.[3], // The field name
                null // The field value (was null)
              ])
            )
          };
        }
      }
      return item;
    });

    // Log details about each record
    console.log('Reconstructed records:', reconstructedData?.map((item: unknown, index: number) => ({
      index,
      isNull: item === null,
      isPartial: item && typeof item === 'object' && '__partial' in item,
      type: typeof item,
      hasId: item && typeof item === 'object' && 'id' in item,
      hasCreatedAt: item && typeof item === 'object' && 'createdAt' in item,
      keys: item && typeof item === 'object' ? Object.keys(item) : []
    })));

    // Include both valid and partial records
    const validItems = (reconstructedData || []).filter((item: unknown): item is ModelType<T> => {
      if (!item || typeof item !== 'object') {
        console.warn('Skipping invalid item:', {
          item,
          type: typeof item,
          isNull: item === null
        });
        return false;
      }
      return true;
    });

    console.log('Valid items before sort:', {
      count: validItems.length,
      items: validItems.map((item: ModelType<T>) => ({
        id: item.id,
        createdAt: item.createdAt,
        isPartial: '__partial' in item,
        keys: Object.keys(item)
      })),
    });

    // Sort items, using creation time if available, otherwise keep original order
    const sortedItems = validItems.sort((a: ModelType<T>, b: ModelType<T>) => {
      try {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0; // Keep original order if no createdAt
      } catch (error) {
        console.error('Error sorting items:', {
          itemA: {
            id: a.id,
            createdAt: a.createdAt,
          },
          itemB: {
            id: b.id,
            createdAt: b.createdAt,
          },
          error,
        });
        return 0;
      }
    });

    return { data: sortedItems };
  } catch (error) {
    console.error(`Error listing ${modelName}:`, error);
    return { data: [] };
  }
}

export async function getFromModel<T extends ModelName>(
  modelName: T,
  id: string
) {
  try {
    // @ts-ignore - Amplify Gen2 typing issue
    const response = await dataClient.models[modelName].get({ id });
    return response;
  } catch (error) {
    console.error(`Error getting ${modelName}:`, error);
    return { data: null };
  }
} 