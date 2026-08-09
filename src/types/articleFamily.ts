export interface ArticleFamily {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  description?: string;
  articleScope: 'ALL' | 'RAW_MATERIAL' | 'FINAL_PRODUCT' | 'PACKAGING';
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtual fields populated by service
  childCount?: number;
  parentName?: string;
}

export interface CreateArticleFamilyDTO {
  parentId?: string | null;
  code: string;
  name: string;
  description?: string;
  articleScope?: 'ALL' | 'RAW_MATERIAL' | 'FINAL_PRODUCT' | 'PACKAGING';
  icon?: string;
  sortOrder?: number;
}

export interface UpdateArticleFamilyDTO {
  parentId?: string | null;
  code?: string;
  name?: string;
  description?: string;
  articleScope?: 'ALL' | 'RAW_MATERIAL' | 'FINAL_PRODUCT' | 'PACKAGING';
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}
