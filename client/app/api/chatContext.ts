interface ChatContextData {
    lists: Record<string, any>;
    todos: Record<string, any>;
  }
  
  interface ChatContextGeneratorOptions {
    showAllTodos?: boolean;
    userLocale?: string;
  }
  
  /**
   * Creates a generator for chat context information based on provided data.
   * This version outputs only XML: <lists> with each <list> containing its <todo> children.
   */
  export function createChatContextGenerator(data: ChatContextData, options: ChatContextGeneratorOptions = {}) {
    // XML escaping
    const escapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    };
    const xmlEscape = (val: any) => typeof val === 'string' ? val.replace(/[<>&'\"]/g, c => escapeMap[c] || c) : String(val);
  
    // Main XML generator
    const generateXml = (): string => {
      const { lists = {}, todos = {} } = data;
  
      // If no data, return empty structure
      if (Object.keys(lists).length === 0 && Object.keys(todos).length === 0) {
        return '<lists></lists>';
      }
  
      // Group todos by list
      const todosByList: Record<string, any[]> = {};
      Object.entries(todos).forEach(([todoId, todoData]) => {
        const listId = todoData.list;
        if (listId) {
          if (!todosByList[listId]) todosByList[listId] = [];
          todosByList[listId].push({ id: todoId, ...todoData });
        }
      });
  
      // Build XML for lists and their todos
      const listsXml = Object.entries(lists).map(([listId, listData]) => {
        // List fields (excluding systemPrompt and code)
        const listFieldsXml = Object.entries(listData)
          .filter(([key, value]) => 
            value !== undefined && 
            value !== '' && 
            // key !== 'systemPrompt' && 
            key !== 'code'
          )
          .map(([key, value]) => `<${key}>${xmlEscape(value)}</${key}>`)
          .join(' ');
        
        // Todos for this list
        const todosForList = todosByList[listId] || [];
        const todosXml = todosForList.map(todo => {
          const todoFieldsXml = Object.entries(todo)
            .filter(([key, value]) => 
              key !== 'id' && 
              key !== 'list' && 
              value !== undefined && 
              value !== ''
            )
            .map(([key, value]) => `<${key}>${xmlEscape(value)}</${key}>`)
            .join(' ');
          return `<todo id="${xmlEscape(todo.id)}">${todoFieldsXml}</todo>`;
        }).join('\n');
        
        return `<list id="${xmlEscape(listId)}">${listFieldsXml}${todosXml ? '\n' + todosXml : ''}</list>`;
      }).join('\n');
  
      return `<lists>\n${listsXml}\n</lists>`;
    };
  
    return {
      getSystemMessage: generateXml,
      getAllTodosJson: () => Object.values(data.todos || {}),
      getAllListsJson: () => Object.values(data.lists || {})
    };
  }
  