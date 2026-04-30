// HR Surveys — DB shapes + app constants

export const SURVEY_STATUSES = ["draft", "active", "closed"] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "rating",
  "yes_no",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  rating: "Rating",
  yes_no: "Yes / No",
};

export type QuestionConfig = {
  // single_choice + multi_choice
  options?: string[];
  // rating
  scale_min?: number;
  scale_max?: number;
  scale_label_low?: string;
  scale_label_high?: string;
};

export type DbHrSurvey = {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructions: string;
  status: string;
  anonymous_allowed: boolean;
  collect_name: boolean;
  collect_email: boolean;
  collect_department: boolean;
  audience: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  closes_at: string | null;
};

export type DbHrSurveyQuestion = {
  id: string;
  survey_id: string;
  position: number;
  question_type: string;
  prompt: string;
  help_text: string;
  required: boolean;
  config: QuestionConfig;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbHrSurveyResponse = {
  id: string;
  survey_id: string;
  submitted_at: string;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_department: string | null;
  is_anonymous: boolean;
  user_agent: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type DbHrSurveyAnswer = {
  id: string;
  response_id: string;
  question_id: string;
  value_text: string | null;
  value_choice: string | null;
  value_choices: string[] | null;
  value_number: number | null;
  created_at: string;
};

// Aggregate / list shapes used in the UI
export type SurveyListItem = DbHrSurvey & {
  response_count: number;
  last_response_at: string | null;
  question_count: number;
};

export type SurveyResponseWithAnswers = DbHrSurveyResponse & {
  answers: DbHrSurveyAnswer[];
};

export type PublicAnswerInput = {
  question_id: string;
  value_text?: string | null;
  value_choice?: string | null;
  value_choices?: string[] | null;
  value_number?: number | null;
};

export type QuestionAggregate =
  | { type: "text"; question: DbHrSurveyQuestion; sample: string[] }
  | {
      type: "choice";
      question: DbHrSurveyQuestion;
      counts: { value: string; count: number }[];
      total: number;
    }
  | {
      type: "rating";
      question: DbHrSurveyQuestion;
      average: number | null;
      count: number;
      distribution: { value: number; count: number }[];
    }
  | {
      type: "yes_no";
      question: DbHrSurveyQuestion;
      yes: number;
      no: number;
    };
