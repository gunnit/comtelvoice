import { prisma } from '../index.js';
import type { AgentConfig, AgentInstructions, KnowledgeBase, ToolConfig } from '@prisma/client';

// ============================================
// SINGLETON CONFIG - One config for the entire deployment
// ============================================

// System user email for global config (created by migration script)
const SYSTEM_USER_EMAIL = 'system@comtelitalia.it';

// Cached system user ID (fetched on first use)
let cachedSystemUserId: string | null = null;

/**
 * Get the system user ID for global config
 * Creates the system user if it doesn't exist
 */
export async function getSystemUserId(): Promise<string> {
  if (cachedSystemUserId) {
    return cachedSystemUserId;
  }

  // Try to find existing system user
  let systemUser = await prisma.user.findUnique({
    where: { email: SYSTEM_USER_EMAIL },
    select: { id: true },
  });

  // If not found, create it (for backwards compatibility / auto-setup)
  if (!systemUser) {
    console.log('🔧 Creating system user for global config...');
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash('SystemUser2024!', 12);

    systemUser = await prisma.user.create({
      data: {
        email: SYSTEM_USER_EMAIL,
        passwordHash,
        name: 'Sistema',
        companyName: 'Comtel Italia',
        isActive: false, // System user cannot login
      },
      select: { id: true },
    });
    console.log(`✅ System user created with ID: ${systemUser.id}`);
  }

  cachedSystemUserId = systemUser.id;
  return cachedSystemUserId;
}

// Export for backwards compatibility (but prefer using getSystemUserId())
export const GLOBAL_CONFIG_USER_ID = 'system-user'; // Placeholder - actual ID is fetched dynamically

// Cached config (loaded at startup, refreshed on save)
let cachedConfig: FullAgentConfig | null = null;
let configLoadedAt: Date | null = null;

// Default tool configurations - all tools with their default enabled state
const DEFAULT_TOOLS = [
  // General tools
  { toolName: 'get_company_info', enabled: true },
  { toolName: 'get_business_hours', enabled: true },
  { toolName: 'get_location', enabled: true },
  { toolName: 'schedule_callback', enabled: true },
  { toolName: 'take_message', enabled: true },
  { toolName: 'transfer_call', enabled: true },
  // Financial tools
  { toolName: 'verify_access_code', enabled: false },
  { toolName: 'get_financial_summary', enabled: false },
  { toolName: 'get_balance_sheet', enabled: false },
  { toolName: 'get_income_statement', enabled: false },
  { toolName: 'get_financial_metrics', enabled: false },
  { toolName: 'get_business_lines', enabled: false },
  { toolName: 'get_cash_flow_statement', enabled: false },
  { toolName: 'get_recent_events', enabled: false },
  { toolName: 'get_organizational_structure', enabled: false },
  { toolName: 'get_company_info_financial', enabled: false },
  { toolName: 'get_historical_comparison', enabled: false },
  { toolName: 'get_outlook_2025', enabled: false },
  { toolName: 'get_highlights_criticalities', enabled: false },
];

// Default knowledge base with Comtel Italia values (for seeding)
export const DEFAULT_KNOWLEDGE_BASE = {
  companyName: 'Comtel Italia',
  companyTagline: '#WEconnect',
  companyDescription: 'Leader nell\'integrazione di sistemi ICT in Italia da oltre 20 anni',
  companyMission: 'Uniamo persone, tecnologie e informazioni in un\'unica infrastruttura dinamica e scalabile',
  phoneMain: '+39 02 2052781',
  phoneSupport: '+39 800 200 960',
  email: 'info@comtelitalia.it',
  website: 'www.comtelitalia.it',
  address: 'Via Vittor Pisani, 10',
  city: 'Milano',
  postalCode: '20124',
  region: 'Lombardia',
  country: 'Italia',
  businessHours: {
    lunedi: '09:00 - 18:00',
    martedi: '09:00 - 18:00',
    mercoledi: '09:00 - 18:00',
    giovedi: '09:00 - 18:00',
    venerdi: '09:00 - 18:00',
    sabato: 'Chiuso',
    domenica: 'Chiuso'
  },
  timezone: 'CET/CEST',
  holidayNote: 'Chiuso durante le festività nazionali italiane',
  services: [
    'VoIP e Unified Communications',
    'Session Border Controller e Media Gateway',
    'Modern Work e Collaboration',
    'Data Networking',
    'Network Security e Cybersecurity',
    'Cloud e IT Transformation',
    'Infrastrutture Tecnologiche',
    'Audio e Video Solutions'
  ],
  businessAreas: [
    'Customer & User Interaction',
    'Networking & Security',
    'Infrastructure Technology',
    'Audio & Video'
  ],
  partners: ['Microsoft', 'Huawei', 'HPE'],
  transferNumberMain: process.env.TRANSFER_NUMBER_MAIN || '+390220527877',
  transferNumberSupport: process.env.TRANSFER_NUMBER_SUPPORT || '+390220527877',
  financialAccessEnabled: true,
  financialAccessCodes: ['COMTEL2024', 'FINANCE123', 'BILANCIO2024'],
};

/**
 * Full agent configuration with all related data
 */
export interface FullAgentConfig {
  config: AgentConfig;
  instructions: AgentInstructions | null;
  knowledgeBase: KnowledgeBase | null;
  toolConfigs: ToolConfig[];
}

export const agentConfigService = {
  /**
   * Get full agent configuration for a user
   */
  async getFullConfig(userId: string): Promise<FullAgentConfig | null> {
    try {
      const config = await prisma.agentConfig.findUnique({
        where: { userId },
        include: {
          instructions: true,
          knowledgeBase: true,
          toolConfigs: true,
        },
      });

      if (!config) return null;

      return {
        config,
        instructions: config.instructions,
        knowledgeBase: config.knowledgeBase,
        toolConfigs: config.toolConfigs,
      };
    } catch (error) {
      console.error('❌ Failed to get agent config:', error);
      return null;
    }
  },

  /**
   * Create default agent configuration for a new user
   */
  async createDefault(userId: string, useComtelDefaults: boolean = true): Promise<AgentConfig> {
    console.log(`🔧 Creating default agent config for user ${userId}`);

    const knowledgeData = useComtelDefaults
      ? DEFAULT_KNOWLEDGE_BASE
      : {
          companyName: 'La Tua Azienda',
          timezone: 'CET/CEST',
          country: 'Italia',
        };

    const toolsWithFinancial = useComtelDefaults
      ? DEFAULT_TOOLS.map(t => ({ ...t, enabled: true })) // Enable all for Comtel
      : DEFAULT_TOOLS;

    return prisma.agentConfig.create({
      data: {
        userId,
        agentName: 'Arthur',
        voice: 'verse',
        temperature: 0.2,
        instructions: {
          create: {
            useTemplate: true,
          },
        },
        knowledgeBase: {
          create: knowledgeData as any,
        },
        toolConfigs: {
          create: toolsWithFinancial,
        },
      },
    });
  },

  /**
   * Update core agent settings
   */
  async updateConfig(
    userId: string,
    data: Partial<Omit<AgentConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AgentConfig | null> {
    try {
      return await prisma.agentConfig.update({
        where: { userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('❌ Failed to update agent config:', error);
      return null;
    }
  },

  /**
   * Update agent instructions
   */
  async updateInstructions(
    userId: string,
    data: Partial<Omit<AgentInstructions, 'id' | 'agentConfigId' | 'createdAt' | 'updatedAt'>>
  ): Promise<AgentInstructions | null> {
    try {
      const config = await prisma.agentConfig.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!config) {
        console.error('❌ No agent config found for user:', userId);
        return null;
      }

      return await prisma.agentInstructions.upsert({
        where: { agentConfigId: config.id },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          agentConfigId: config.id,
          useTemplate: data.useTemplate ?? true,
          customInstructions: data.customInstructions,
          roleDescription: data.roleDescription,
          communicationStyle: data.communicationStyle,
          languageInstructions: data.languageInstructions,
          closingInstructions: data.closingInstructions,
          additionalInstructions: data.additionalInstructions,
        },
      });
    } catch (error) {
      console.error('❌ Failed to update instructions:', error);
      return null;
    }
  },

  /**
   * Update knowledge base
   */
  async updateKnowledgeBase(
    userId: string,
    data: Partial<Omit<KnowledgeBase, 'id' | 'agentConfigId' | 'createdAt' | 'updatedAt'>>
  ): Promise<KnowledgeBase | null> {
    try {
      const config = await prisma.agentConfig.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!config) {
        console.error('❌ No agent config found for user:', userId);
        return null;
      }

      return await prisma.knowledgeBase.upsert({
        where: { agentConfigId: config.id },
        update: {
          ...data,
          updatedAt: new Date(),
        } as any,
        create: {
          agentConfigId: config.id,
          ...data,
        } as any,
      });
    } catch (error) {
      console.error('❌ Failed to update knowledge base:', error);
      return null;
    }
  },

  /**
   * Update a single tool configuration
   */
  async updateToolConfig(
    userId: string,
    toolName: string,
    data: { enabled?: boolean; parameters?: any; descriptionOverride?: string }
  ): Promise<ToolConfig | null> {
    try {
      const config = await prisma.agentConfig.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!config) {
        console.error('❌ No agent config found for user:', userId);
        return null;
      }

      return await prisma.toolConfig.upsert({
        where: {
          agentConfigId_toolName: {
            agentConfigId: config.id,
            toolName,
          },
        },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          agentConfigId: config.id,
          toolName,
          enabled: data.enabled ?? true,
          parameters: data.parameters,
          descriptionOverride: data.descriptionOverride,
        },
      });
    } catch (error) {
      console.error('❌ Failed to update tool config:', error);
      return null;
    }
  },

  /**
   * Bulk update tool configurations
   */
  async updateToolConfigs(
    userId: string,
    tools: Array<{ toolName: string; enabled: boolean; parameters?: any }>
  ): Promise<boolean> {
    try {
      const config = await prisma.agentConfig.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!config) {
        console.error('❌ No agent config found for user:', userId);
        return false;
      }

      await prisma.$transaction(
        tools.map((tool) =>
          prisma.toolConfig.upsert({
            where: {
              agentConfigId_toolName: {
                agentConfigId: config.id,
                toolName: tool.toolName,
              },
            },
            update: {
              enabled: tool.enabled,
              parameters: tool.parameters,
              updatedAt: new Date(),
            },
            create: {
              agentConfigId: config.id,
              toolName: tool.toolName,
              enabled: tool.enabled,
              parameters: tool.parameters,
            },
          })
        )
      );

      console.log(`✅ Updated ${tools.length} tool configs for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update tool configs:', error);
      return false;
    }
  },

  /**
   * Get or create config for user (ensures config always exists)
   */
  async getOrCreate(userId: string): Promise<FullAgentConfig> {
    let fullConfig = await this.getFullConfig(userId);

    if (!fullConfig) {
      console.log(`🆕 Creating new agent config for user ${userId}`);
      await this.createDefault(userId, true); // Use Comtel defaults for now
      fullConfig = await this.getFullConfig(userId);
    }

    return fullConfig!;
  },

  /**
   * Delete agent configuration (for cleanup)
   */
  async deleteConfig(userId: string): Promise<boolean> {
    try {
      await prisma.agentConfig.delete({
        where: { userId },
      });
      console.log(`🗑️ Deleted agent config for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete agent config:', error);
      return false;
    }
  },

  /**
   * List all available tools with their default descriptions
   */
  getAvailableTools(): Array<{ name: string; description: string; category: string }> {
    return [
      // General tools
      { name: 'get_company_info', description: 'Fornisce informazioni sull\'azienda', category: 'general' },
      { name: 'get_business_hours', description: 'Fornisce gli orari di apertura', category: 'general' },
      { name: 'get_location', description: 'Fornisce l\'indirizzo dell\'ufficio', category: 'general' },
      { name: 'schedule_callback', description: 'Pianifica una richiamata', category: 'general' },
      { name: 'take_message', description: 'Prende un messaggio per un dipendente', category: 'general' },
      { name: 'transfer_call', description: 'Trasferisce la chiamata', category: 'general' },
      // Financial tools
      { name: 'verify_access_code', description: 'Verifica il codice di accesso', category: 'financial' },
      { name: 'get_financial_summary', description: 'Sintesi finanziaria', category: 'financial' },
      { name: 'get_balance_sheet', description: 'Stato patrimoniale', category: 'financial' },
      { name: 'get_income_statement', description: 'Conto economico', category: 'financial' },
      { name: 'get_financial_metrics', description: 'KPI finanziari', category: 'financial' },
      { name: 'get_business_lines', description: 'Linee di business', category: 'financial' },
      { name: 'get_cash_flow_statement', description: 'Rendiconto finanziario', category: 'financial' },
      { name: 'get_recent_events', description: 'Eventi recenti', category: 'financial' },
      { name: 'get_organizational_structure', description: 'Struttura organizzativa', category: 'financial' },
      { name: 'get_company_info_financial', description: 'Info istituzionali', category: 'financial' },
      { name: 'get_historical_comparison', description: 'Confronto storico', category: 'financial' },
      { name: 'get_outlook_2025', description: 'Outlook 2025', category: 'financial' },
      { name: 'get_highlights_criticalities', description: 'Highlights e criticità', category: 'financial' },
    ];
  },
};

// ============================================
// SINGLETON CONFIG FUNCTIONS
// ============================================

/**
 * Get the global/singleton config (cached)
 * This is the main entry point for getting agent config at runtime
 */
export async function getGlobalConfig(): Promise<FullAgentConfig | null> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // Load from database
  return loadGlobalConfig();
}

/**
 * Load global config from database (bypasses cache)
 */
export async function loadGlobalConfig(): Promise<FullAgentConfig | null> {
  try {
    console.log('🔄 Loading global agent config from database...');

    const systemUserId = await getSystemUserId();
    let fullConfig = await agentConfigService.getFullConfig(systemUserId);

    // If no config exists, create default
    if (!fullConfig) {
      console.log('🆕 No global config found, creating default with Comtel values...');
      await agentConfigService.createDefault(systemUserId, true);
      fullConfig = await agentConfigService.getFullConfig(systemUserId);
    }

    if (fullConfig) {
      cachedConfig = fullConfig;
      configLoadedAt = new Date();
      console.log(`✅ Global config loaded: ${fullConfig.config.agentName} (voice: ${fullConfig.config.voice})`);
      console.log(`   Knowledge base: ${fullConfig.knowledgeBase?.companyName || 'Not set'}`);
      console.log(`   Tools enabled: ${fullConfig.toolConfigs.filter(t => t.enabled).length}/${fullConfig.toolConfigs.length}`);
    }

    return fullConfig;
  } catch (error) {
    console.error('❌ Failed to load global config:', error);
    return null;
  }
}

/**
 * Refresh the cached config (call after saving changes)
 */
export async function refreshGlobalConfig(): Promise<FullAgentConfig | null> {
  console.log('🔄 Refreshing global agent config cache...');
  cachedConfig = null;
  configLoadedAt = null;
  return loadGlobalConfig();
}

/**
 * Get cached config without async (returns null if not loaded)
 * Useful for synchronous access in agent creation
 */
export function getCachedConfig(): FullAgentConfig | null {
  return cachedConfig;
}

/**
 * Check if config is loaded
 */
export function isConfigLoaded(): boolean {
  return cachedConfig !== null;
}

/**
 * Get config load timestamp
 */
export function getConfigLoadedAt(): Date | null {
  return configLoadedAt;
}

// ============================================
// SINGLETON CRUD WRAPPERS
// ============================================

/**
 * Update global agent config
 */
export async function updateGlobalAgentConfig(
  data: Partial<Omit<AgentConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<AgentConfig | null> {
  const systemUserId = await getSystemUserId();
  const result = await agentConfigService.updateConfig(systemUserId, data);
  if (result) {
    await refreshGlobalConfig();
  }
  return result;
}

/**
 * Update global instructions
 */
export async function updateGlobalInstructions(
  data: Partial<Omit<AgentInstructions, 'id' | 'agentConfigId' | 'createdAt' | 'updatedAt'>>
): Promise<AgentInstructions | null> {
  const systemUserId = await getSystemUserId();
  const result = await agentConfigService.updateInstructions(systemUserId, data);
  if (result) {
    await refreshGlobalConfig();
  }
  return result;
}

/**
 * Update global knowledge base
 */
export async function updateGlobalKnowledgeBase(
  data: Partial<Omit<KnowledgeBase, 'id' | 'agentConfigId' | 'createdAt' | 'updatedAt'>>
): Promise<KnowledgeBase | null> {
  const systemUserId = await getSystemUserId();
  const result = await agentConfigService.updateKnowledgeBase(systemUserId, data);
  if (result) {
    await refreshGlobalConfig();
  }
  return result;
}

/**
 * Update global tool configs
 */
export async function updateGlobalToolConfigs(
  tools: Array<{ toolName: string; enabled: boolean; parameters?: any }>
): Promise<boolean> {
  const systemUserId = await getSystemUserId();
  const result = await agentConfigService.updateToolConfigs(systemUserId, tools);
  if (result) {
    await refreshGlobalConfig();
  }
  return result;
}
