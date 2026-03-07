export interface BoardFile {
  name: string;
  fullname: string;
  displayname: string;
  path: string;
  thumbnail: string;
  md5?: string;
  type: number;
  size: number;
  width: number;
  height: number;
  tn_width: number;
  tn_height: number;
  nsfw?: number;
  duration?: string;
  duration_secs?: number;
  pack?: string;
  sticker?: string;
  install?: string;
}

export interface Post {
  num: number;
  parent: number;
  board: string;
  timestamp: number;
  lasthit: number;
  date: string;
  email?: string;
  subject?: string;
  comment: string;
  files?: BoardFile[];
  views: number;
  sticky: number;
  endless: number;
  closed: number;
  banned: number;
  op: number;
  name?: string;
  icon?: string;
  trip?: string;
  trip_style?: string;
  tags?: string;
  likes?: number;
  dislikes?: number;
  posts_count?: number;
  files_count?: number;
}

export interface Board {
  id: string;
  name: string;
  category: string;
  info: string;
  info_outer: string;
  threads_per_page: number;
  bump_limit: number;
  max_pages: number;
  default_name: string;
  enable_names: boolean;
  enable_trips: boolean;
  enable_subject: boolean;
  enable_sage: boolean;
  enable_icons: boolean;
  enable_flags: boolean;
  enable_dices: boolean;
  enable_shield: boolean;
  enable_thread_tags: boolean;
  enable_posting: boolean;
  enable_likes: boolean;
  enable_oekaki: boolean;
  file_types: string[];
  max_comment: number;
  max_files_size: number;
  tags?: string[];
  icons?: { num: number; name: string; url: string }[];
}

export interface ApiError {
  code: number;
  message: string;
}

export interface ThreadPostsAfterResponse {
  result: number;
  error?: ApiError;
  unique_posters?: number;
  posts?: Post[];
}

export interface ThreadLastInfoResponse {
  result: number;
  error?: ApiError;
  thread?: {
    num: number;
    timestamp: number;
    posts: number;
  };
}

export interface MobilePostResponse {
  result: number;
  error?: ApiError;
  post?: Post;
}

export interface CaptchaResponse {
  result: number;
  error?: ApiError;
  type: string;
  id: string;
  expires?: number;
  input?: string;
}

export interface EmojiCaptchaShowResponse {
  image?: string;
  keyboard?: string[];
  success?: string;
}

export interface PostingResponse {
  result: number;
  error?: ApiError;
  thread?: number;
  num?: number;
}

export interface ReportResponse {
  result: number;
  error?: ApiError;
}

export interface PasscodeResponse {
  result: number;
  error?: ApiError;
  passcode?: {
    type: string;
    expires: number;
  };
}

export interface LikeResponse {
  result: number;
  error?: ApiError;
}

export interface CatalogThread extends Post {
  posts_count: number;
  files_count: number;
}

export interface CatalogResponse {
  board: {
    id: string;
    name: string;
  };
  threads: CatalogThread[];
}

export interface ThreadResponse {
  board: {
    id: string;
    name: string;
  };
  threads: {
    posts: Post[];
  }[];
  unique_posters?: number;
}
