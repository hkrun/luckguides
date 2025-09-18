/*
 Navicat Premium Data Transfer

 Source Server         : localhost_5432
 Source Server Type    : PostgreSQL
 Source Server Version : 170004 (170004)
 Source Host           : localhost:5432
 Source Catalog        : huanlian
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170004 (170004)
 File Encoding         : 65001

 Date: 08/09/2025 13:56:26
*/


-- ----------------------------
-- Sequence structure for nf_api_keys_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_api_keys_id_seq";
CREATE SEQUENCE "public"."nf_api_keys_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for nf_api_usage_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_api_usage_id_seq";
CREATE SEQUENCE "public"."nf_api_usage_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for nf_contact_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_contact_id_seq";
CREATE SEQUENCE "public"."nf_contact_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for nf_credits_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_credits_id_seq";
CREATE SEQUENCE "public"."nf_credits_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;


-- ----------------------------
-- Sequence structure for nf_error_logs_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_error_logs_id_seq";
CREATE SEQUENCE "public"."nf_error_logs_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for nf_health_assessments_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_health_assessments_id_seq";
CREATE SEQUENCE "public"."nf_health_assessments_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for nf_names_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_names_id_seq";
CREATE SEQUENCE "public"."nf_names_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for nf_subscription_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_subscription_id_seq";
CREATE SEQUENCE "public"."nf_subscription_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;


-- ----------------------------
-- Sequence structure for nf_user_health_assessment_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_user_health_assessment_id_seq";
CREATE SEQUENCE "public"."nf_user_health_assessment_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for nf_users_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."nf_users_id_seq";
CREATE SEQUENCE "public"."nf_users_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;


-- ----------------------------
-- Table structure for nf_api_keys
-- ----------------------------
DROP TABLE IF EXISTS "public"."nf_api_keys";
CREATE TABLE "public"."nf_api_keys" (
  "id" int4 NOT NULL DEFAULT nextval('nf_api_keys_id_seq'::regclass),
  "user_id" varchar(32) COLLATE "pg_catalog"."default" NOT NULL,
  "api_key" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "api_key_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" DEFAULT 'Default API Key'::character varying,
  "description" text COLLATE "pg_catalog"."default",
  "status" char(1) COLLATE "pg_catalog"."default" DEFAULT '1'::bpchar,
  "last_used_at" timestamp(6),
  "usage_count" int4 DEFAULT 0,
  "monthly_usage" int4 DEFAULT 0,
  "monthly_limit" int4 DEFAULT 10000,
  "expires_at" timestamp(6),
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;
COMMENT ON COLUMN "public"."nf_api_keys"."user_id" IS '用户ID';
COMMENT ON COLUMN "public"."nf_api_keys"."api_key" IS 'API密钥（前缀显示用）';
COMMENT ON COLUMN "public"."nf_api_keys"."api_key_hash" IS 'API密钥哈希值（用于验证）';
COMMENT ON COLUMN "public"."nf_api_keys"."name" IS 'API密钥名称';
COMMENT ON COLUMN "public"."nf_api_keys"."description" IS 'API密钥描述';
COMMENT ON COLUMN "public"."nf_api_keys"."status" IS '状态: 1=活跃, 0=禁用';
COMMENT ON COLUMN "public"."nf_api_keys"."last_used_at" IS '最后使用时间';
COMMENT ON COLUMN "public"."nf_api_keys"."usage_count" IS '总使用次数';
COMMENT ON COLUMN "public"."nf_api_keys"."monthly_usage" IS '当月使用次数';
COMMENT ON COLUMN "public"."nf_api_keys"."monthly_limit" IS '月度使用限制';
COMMENT ON COLUMN "public"."nf_api_keys"."expires_at" IS '过期时间';
COMMENT ON TABLE "public"."nf_api_keys" IS 'API密钥管理表';

-- ----------------------------
-- Table structure for nf_api_usage
-- ----------------------------
DROP TABLE IF EXISTS "public"."nf_api_usage";
CREATE TABLE "public"."nf_api_usage" (
  "id" int4 NOT NULL DEFAULT nextval('nf_api_usage_id_seq'::regclass),
  "api_key_id" int4 NOT NULL,
  "user_id" varchar(32) COLLATE "pg_catalog"."default" NOT NULL,
  "endpoint" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "method" varchar(10) COLLATE "pg_catalog"."default" DEFAULT 'POST'::character varying,
  "status_code" int4,
  "response_time" int4,
  "request_size" int4,
  "response_size" int4,
  "ip_address" varchar(45) COLLATE "pg_catalog"."default",
  "user_agent" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;
COMMENT ON COLUMN "public"."nf_api_usage"."api_key_id" IS 'API密钥ID';
COMMENT ON COLUMN "public"."nf_api_usage"."endpoint" IS '调用的API端点';
COMMENT ON COLUMN "public"."nf_api_usage"."method" IS 'HTTP方法';
COMMENT ON COLUMN "public"."nf_api_usage"."status_code" IS 'HTTP状态码';
COMMENT ON COLUMN "public"."nf_api_usage"."response_time" IS '响应时间（毫秒）';
COMMENT ON COLUMN "public"."nf_api_usage"."request_size" IS '请求大小（字节）';
COMMENT ON COLUMN "public"."nf_api_usage"."response_size" IS '响应大小（字节）';
COMMENT ON TABLE "public"."nf_api_usage" IS 'API使用统计表';

-- ----------------------------
-- Table structure for nf_contact
-- ----------------------------
DROP TABLE IF EXISTS "public"."nf_contact";
CREATE TABLE "public"."nf_contact" (
  "id" int4 NOT NULL DEFAULT nextval('nf_contact_id_seq'::regclass),
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "email" varchar(255) COLLATE "pg_catalog"."default",
  "message" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for nf_credits
-- ----------------------------
DROP TABLE IF EXISTS "public"."nf_credits";
CREATE TABLE "public"."nf_credits" (
  "id" int4 NOT NULL DEFAULT nextval('nf_credits_id_seq'::regclass),
  "user_id" varchar(32) COLLATE "pg_catalog"."default" NOT NULL,
  "product_name" varchar(64) COLLATE "pg_catalog"."default",
  "order_number" varchar(64) COLLATE "pg_catalog"."default" DEFAULT '0'::character varying,
  "order_price" numeric(10,2) DEFAULT 0,
  "order_date" timestamp(6),
  "credit_amount" int4 DEFAULT 0,
  "credit_type" char(1) COLLATE "pg_catalog"."default",
  "credit_transaction_type" char(1) COLLATE "pg_catalog"."default",
  "credit_desc" varchar(256) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;
COMMENT ON COLUMN "public"."nf_credits"."credit_type" IS '0=赠送积分 1=订阅积分 2=充值积分 3=退款积分';
COMMENT ON COLUMN "public"."nf_credits"."credit_transaction_type" IS '0=消费积分 1=获得积分 2=退款积分';
COMMENT ON TABLE "public"."nf_credits" IS '用户积分记录表';


-- ----------------------------
-- Table structure for nf_error_logs
-- ----------------------------
DROP TABLE IF EXISTS "public"."nf_error_logs";
CREATE TABLE "public"."nf_error_logs" (
  "id" int4 NOT NULL DEFAULT nextval('nf_error_logs_id_seq'::regclass),
  "user_id" varchar(32) COLLATE "pg_catalog"."default" NOT NULL,
  "error_type" char(1) COLLATE "pg_catalog"."default",
  "error_msg" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for nf_naming_tasks
-- ----------------------------
DROP TABLE IF EXISTS "public"."nf_naming_tasks";
CREATE TABLE "public"."nf_naming_tasks" (
  "id" int4 NOT NULL DEFAULT nextval('nf_names_id_seq'::regclass),
  "user_id" varchar(255) COLLATE "pg_catalog"."default",
  "action" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "params" jsonb NOT NULL,
  "result" jsonb NOT NULL,
  "ip" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Table structure for nf_subscription
-- ----------------------------
DROP TABLE IF EXISTS "public"."nf_subscription";
CREATE TABLE "public"."nf_subscription" (
  "id" int4 NOT NULL DEFAULT nextval('nf_subscription_id_seq'::regclass),
  "user_id" varchar(32) COLLATE "pg_catalog"."default" NOT NULL,
  "order_number" varchar(64) COLLATE "pg_catalog"."default" DEFAULT '0'::character varying,
  "subscription_id" varchar(64) COLLATE "pg_catalog"."default" DEFAULT '0'::character varying,
  "order_price" numeric(10,2) DEFAULT 0,
  "credit_amount" int4 DEFAULT 0,
  "order_type" char(1) COLLATE "pg_catalog"."default",
  "order_desc" varchar(256) COLLATE "pg_catalog"."default",
  "order_date" timestamp(6),
  "subscription_type" varchar(16) COLLATE "pg_catalog"."default" DEFAULT 'monthly'::character varying,
  "subscription_status" varchar(16) COLLATE "pg_catalog"."default" DEFAULT 'active'::character varying,
  "trial_start" timestamp(6),
  "trial_end" timestamp(6),
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "plan_type" varchar(20) COLLATE "pg_catalog"."default" DEFAULT 'basic'::character varying
)
;
COMMENT ON COLUMN "public"."nf_subscription"."plan_type" IS '订阅计划类型: basic=基础版, professional=专业版, business=商业版';


-- ----------------------------
-- Table structure for nf_users
-- ----------------------------
DROP TABLE IF EXISTS "public"."nf_users";
CREATE TABLE "public"."nf_users" (
  "id" int4 NOT NULL DEFAULT nextval('nf_users_id_seq'::regclass),
  "credits" int4 DEFAULT 0,
  "username" varchar(64) COLLATE "pg_catalog"."default",
  "email_address" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "password_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "first_name" varchar(32) COLLATE "pg_catalog"."default",
  "last_name" varchar(32) COLLATE "pg_catalog"."default",
  "gender" varchar(8) COLLATE "pg_catalog"."default",
  "user_id" varchar(32) COLLATE "pg_catalog"."default" NOT NULL,
  "status" char(1) COLLATE "pg_catalog"."default" DEFAULT '1'::bpchar,
  "email_verified" bool DEFAULT false,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;


-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_api_keys_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_api_usage_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_contact_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_credits_id_seq"', 135, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."nf_custom_face_swap_jobs_id_seq"
OWNED BY "public"."nf_custom_face_swap_jobs"."id";
SELECT setval('"public"."nf_custom_face_swap_jobs_id_seq"', 13, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_error_logs_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_health_assessments_id_seq"', 1, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_names_id_seq"', 137, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_subscription_id_seq"', 34, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_template_face_swap_jobs_id_seq"', 13, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_user_health_assessment_id_seq"', 56, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_users_id_seq"', 44, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."nf_video_templates_id_seq"', 11, true);

-- ----------------------------
-- Indexes structure for table nf_api_keys
-- ----------------------------
CREATE UNIQUE INDEX "idx_api_keys_api_key" ON "public"."nf_api_keys" USING btree (
  "api_key" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_keys_created_at" ON "public"."nf_api_keys" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_keys_status" ON "public"."nf_api_keys" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."bpchar_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_keys_user_id" ON "public"."nf_api_keys" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table nf_api_keys
-- ----------------------------
ALTER TABLE "public"."nf_api_keys" ADD CONSTRAINT "nf_api_keys_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table nf_api_usage
-- ----------------------------
CREATE INDEX "idx_api_usage_api_key_id" ON "public"."nf_api_usage" USING btree (
  "api_key_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_usage_created_at" ON "public"."nf_api_usage" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_usage_endpoint" ON "public"."nf_api_usage" USING btree (
  "endpoint" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_usage_user_id" ON "public"."nf_api_usage" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table nf_api_usage
-- ----------------------------
ALTER TABLE "public"."nf_api_usage" ADD CONSTRAINT "nf_api_usage_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table nf_contact
-- ----------------------------
ALTER TABLE "public"."nf_contact" ADD CONSTRAINT "nf_contact_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table nf_credits
-- ----------------------------
CREATE INDEX "idx_credits_created_at" ON "public"."nf_credits" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_credits_order_number" ON "public"."nf_credits" USING btree (
  "order_number" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_credits_user_id" ON "public"."nf_credits" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table nf_credits
-- ----------------------------
ALTER TABLE "public"."nf_credits" ADD CONSTRAINT "nf_credits_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table nf_custom_face_swap_jobs
-- ----------------------------
CREATE INDEX "idx_custom_face_swap_jobs_created_at" ON "public"."nf_custom_face_swap_jobs" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_custom_face_swap_jobs_job_id" ON "public"."nf_custom_face_swap_jobs" USING btree (
  "job_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_custom_face_swap_jobs_status" ON "public"."nf_custom_face_swap_jobs" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_custom_face_swap_jobs_user_id" ON "public"."nf_custom_face_swap_jobs" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table nf_custom_face_swap_jobs
-- ----------------------------
ALTER TABLE "public"."nf_custom_face_swap_jobs" ADD CONSTRAINT "uk_custom_face_swap_jobs_job_id" UNIQUE ("job_id");

-- ----------------------------
-- Primary Key structure for table nf_custom_face_swap_jobs
-- ----------------------------
ALTER TABLE "public"."nf_custom_face_swap_jobs" ADD CONSTRAINT "nf_custom_face_swap_jobs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table nf_error_logs
-- ----------------------------
ALTER TABLE "public"."nf_error_logs" ADD CONSTRAINT "nf_error_logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table nf_naming_tasks
-- ----------------------------
ALTER TABLE "public"."nf_naming_tasks" ADD CONSTRAINT "nf_naming_tasks_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table nf_subscription
-- ----------------------------
CREATE INDEX "idx_subscription_order_type" ON "public"."nf_subscription" USING btree (
  "order_type" COLLATE "pg_catalog"."default" "pg_catalog"."bpchar_ops" ASC NULLS LAST
);
CREATE INDEX "idx_subscription_plan_type" ON "public"."nf_subscription" USING btree (
  "plan_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_subscription_status" ON "public"."nf_subscription" USING btree (
  "subscription_status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_subscription_subscription_id" ON "public"."nf_subscription" USING btree (
  "subscription_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_subscription_trial_dates" ON "public"."nf_subscription" USING btree (
  "trial_start" "pg_catalog"."timestamp_ops" ASC NULLS LAST,
  "trial_end" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_subscription_type" ON "public"."nf_subscription" USING btree (
  "subscription_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_subscription_user_id" ON "public"."nf_subscription" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table nf_subscription
-- ----------------------------
ALTER TABLE "public"."nf_subscription" ADD CONSTRAINT "nf_subscription_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table nf_template_face_swap_jobs
-- ----------------------------
CREATE INDEX "idx_template_face_swap_jobs_created_at" ON "public"."nf_template_face_swap_jobs" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "idx_template_face_swap_jobs_job_id" ON "public"."nf_template_face_swap_jobs" USING btree (
  "job_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_template_face_swap_jobs_status" ON "public"."nf_template_face_swap_jobs" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_template_face_swap_jobs_template_id" ON "public"."nf_template_face_swap_jobs" USING btree (
  "template_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_template_face_swap_jobs_user_id" ON "public"."nf_template_face_swap_jobs" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table nf_template_face_swap_jobs
-- ----------------------------
ALTER TABLE "public"."nf_template_face_swap_jobs" ADD CONSTRAINT "nf_template_face_swap_jobs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table nf_users
-- ----------------------------
CREATE INDEX "idx_users_email" ON "public"."nf_users" USING btree (
  "email_address" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_status" ON "public"."nf_users" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."bpchar_ops" ASC NULLS LAST
);
CREATE INDEX "idx_users_user_id" ON "public"."nf_users" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table nf_users
-- ----------------------------
ALTER TABLE "public"."nf_users" ADD CONSTRAINT "nf_users_email_address_key" UNIQUE ("email_address");
ALTER TABLE "public"."nf_users" ADD CONSTRAINT "nf_users_user_id_key" UNIQUE ("user_id");

-- ----------------------------
-- Primary Key structure for table nf_users
-- ----------------------------
ALTER TABLE "public"."nf_users" ADD CONSTRAINT "nf_users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table nf_video_templates
-- ----------------------------
CREATE INDEX "idx_video_templates_category" ON "public"."nf_video_templates" USING btree (
  "category" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_video_templates_sort_order" ON "public"."nf_video_templates" USING btree (
  "sort_order" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_video_templates_status" ON "public"."nf_video_templates" USING btree (
  "status" COLLATE "pg_catalog"."default" "pg_catalog"."bpchar_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table nf_video_templates
-- ----------------------------
ALTER TABLE "public"."nf_video_templates" ADD CONSTRAINT "nf_video_templates_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table nf_api_usage
-- ----------------------------
ALTER TABLE "public"."nf_api_usage" ADD CONSTRAINT "fk_api_usage_api_key" FOREIGN KEY ("api_key_id") REFERENCES "public"."nf_api_keys" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
