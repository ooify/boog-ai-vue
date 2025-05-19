<template>
  <div class="app-container home">
    <el-row :gutter="20">
      <el-col :sm="24" :lg="12" style="padding-left: 20px">
        <h2>BoogAI后台管理框架</h2>
        <p>
         随着人工智能技术的快速发展，个性化推荐系统在电商、社交、娱乐等领域发挥着越来越重要的作用。传统的推荐系统主要基于用户历史行为数据进行推荐，难以处理多模态数据（如文本、图片等）以及理解用户复杂的语义信息。为了解决上述问题，本项目设计并实现了一种基于LLaMA模型的多模态向量检索推荐系统。</p>
        <p>
          <el-tag type="danger">快速体验</el-tag>
        </p>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }
  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }
}
</style>

