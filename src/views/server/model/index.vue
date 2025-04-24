<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="模型名称" prop="modelName">
        <el-input v-model="queryParams.modelName" placeholder="请输入模型名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="提供方" prop="provider">
        <el-input v-model="queryParams.provider" placeholder="请输入提供方" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="模型类型" prop="modelType">
        <el-select v-model="queryParams.modelType" placeholder="请选择模型类型" clearable>
          <el-option v-for="dict in boog_ai_model_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型特点" prop="tag">
        <el-select v-model="queryParams.tag" placeholder="请选择模型特点" clearable>
          <el-option v-for="dict in boog_ai_model_tag" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option v-for="dict in boog_ai_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="默认" prop="isDefault">
        <el-select v-model="queryParams.isDefault" placeholder="请选择默认" clearable>
          <el-option v-for="dict in boog_ai_default" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 308px">
        <el-date-picker v-model="daterangeCreateTime" value-format="YYYY-MM-DD" type="daterange" range-separator="-"
          start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['server:model:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['server:model:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['server:model:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['server:model:export']">导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain @click="openDrawer = !openDrawer" v-hasPermi="['server:model:ollama']">
          <img src="@/assets/icons/ollama.png" alt="Ollama" width="20" height="20" style="margin-right: 5px;" />
          Ollama管理
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <el-drawer v-model="openDrawer" title="Ollama管理" :direction="'rtl'">
      <el-form label-position="top">
        {{ ollamaURLConfig }}
        <el-form-item label="URL">
          <el-col :span="19">
            <el-input style="width: auto;" v-model="ollamaURLConfig.configValue" type="text" placeholder="ollama url"
              clearable :style="{ width: '90%' }"></el-input>
          </el-col>
          <el-button size="small" icon="Refresh" circle @click="refreshUrl" />
          <el-button size="small" type="success" plain icon="Select" circle @click="updateUrl" />
        </el-form-item>
        <el-form-item label="Models">
          <el-col :span="8">
            <el-button icon="Refresh" @click="getOllamaModels">获取模型</el-button>
          </el-col>
          <el-col :span="12">
            <el-input clearable v-model="modelTag" placeholder="pull ollama model enter tag">
              <template #append>
                <el-button icon="Download" @click="pullOllamaModel" />
              </template>
            </el-input>
          </el-col>

          <!-- 简化的文本风格进度显示 -->
          <el-collapse v-model="activeCollapses" class="progress-collapse">
            <el-collapse-item name="progress" :title="`模型状态: ${showProgress ? '下载中' : '空闲'}`">
              <div class="progress-text-container" v-if="showProgress">
                <div class="progress-text-item">
                  <span class="progress-label">状态:</span>
                  <span class="progress-value" :class="getStatusClass()">{{ progressText }}</span>
                </div>
                <div class="progress-text-item">
                  <span class="progress-label">进度:</span>
                  <span class="progress-value">{{ progressPercentage }}%</span>
                </div>
                <div class="progress-text-item" v-if="isDownloading">
                  <span class="progress-label">层数:</span>
                  <span class="progress-value">{{ Object.keys(layerProgress).length }}</span>
                </div>
                <div class="progress-text-item" v-if="isDownloading && Object.keys(layerProgress).length > 0">
                  <span class="progress-label">下载大小:</span>
                  <span class="progress-value">{{ formatTotalSize() }}</span>
                </div>
              </div>
              <div v-else class="progress-text-empty">
                当前没有下载任务
              </div>
            </el-collapse-item>
          </el-collapse>

          <el-table v-loading="loading" :data="ollamaModels" style="margin-top: 16px; width: 100%;">
            <el-table-column label="模型代码" align="center" prop="model" width="150" />
            <el-table-column label="模型名称" align="center" prop="name" width="150" />
            <el-table-column label="模型大小" align="center" prop="size" :formatter="formatModelSize" />
            <el-table-column label="模型规格" align="center" prop="details.parameter_size" />
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
              <template #default="scope">
                <el-button link type="primary" icon="DocumentAdd" @click="handleModelAdd(scope.row)">添加</el-button>
                <el-button link type="primary" icon="Delete" @click="deleteOllamaModel(scope.row.model)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
    </el-drawer>

    <el-table v-loading="loading" :data="modelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="模型id" align="center" prop="modelId" width="80" />
      <el-table-column label="模型代码" align="center" prop="modelCode" width="200" />
      <el-table-column label="模型名称" align="center" prop="modelName" width="200" />
      <el-table-column label="模型版本" align="center" prop="modelVersion" width="80" />
      <el-table-column label="提供方" align="center" prop="provider" />
      <el-table-column label="模型类型" align="center" prop="modelType" width="100">
        <template #default="scope">
          <dict-tag :options="boog_ai_model_type" :value="scope.row.modelType" />
        </template>
      </el-table-column>
      <el-table-column label="模型描述" align="center" prop="description" />
      <el-table-column label="调用地址" align="center" prop="apiEndpoint" width="180" />
      <el-table-column label="模型特点" align="center" prop="tag">
        <template #default="scope">
          <dict-tag :options="boog_ai_model_tag" :value="scope.row.tag" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="boog_ai_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="默认" align="center" prop="isDefault">
        <template #default="scope">
          <dict-tag :options="boog_ai_default" :value="scope.row.isDefault" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="130">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="130">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="130">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['server:model:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
            v-hasPermi="['server:model:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改模型对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <!-- 基本信息部分 -->
          <el-col :span="24">
            <div class="section-title">基本信息</div>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型代码" prop="modelCode">
              <el-input v-model="form.modelCode" placeholder="请输入模型代码" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型名称" prop="modelName">
              <el-input v-model="form.modelName" placeholder="请输入模型名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型版本" prop="modelVersion">
              <el-input v-model="form.modelVersion" placeholder="请输入模型版本" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="提供方" prop="provider">
              <el-input v-model="form.provider" placeholder="请输入提供方" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型类型" prop="modelType">
              <el-select v-model="form.modelType" placeholder="请选择模型类型" style="width: 100%">
                <el-option v-for="dict in boog_ai_model_type" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="模型特点" prop="tag">
              <el-select v-model="form.tag" placeholder="模型特点" style="width: 100%">
                <el-option v-for="dict in boog_ai_model_tag" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 模型配置部分 -->
          <el-col :span="24">
            <div class="section-title">模型配置</div>
          </el-col>

          <el-col :span="24">
            <el-form-item label="调用地址" prop="apiEndpoint">
              <el-input v-model="form.apiEndpoint" placeholder="请输入API调用地址" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="模型描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入模型描述信息" />
            </el-form-item>
          </el-col>

          <!-- 状态设置部分 -->
          <el-col :span="24">
            <div class="section-title">状态设置</div>
          </el-col>

          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-switch v-model="form.status" active-value="1" inactive-value="0" active-text="启用"
                inactive-text="禁用"></el-switch>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="设为默认" prop="isDefault">
              <el-switch v-model="form.isDefault" active-value="1" inactive-value="0" active-text="是" inactive-text="否"
                :disabled="form.status === '0'"></el-switch>
              <div v-if="form.status === '0' && form.isDefault === '1'" class="el-form-item__error">
                禁用状态下不能设为默认模型
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Model">
import { listModel, getModel, delModel, addModel, updateModel } from "@/api/server/model";
import { getConfigKey, listConfig, updateConfig } from "@/api/system/config";
import axios from 'axios';
import { ref } from 'vue';
const { proxy } = getCurrentInstance();
const { boog_ai_model_tag, boog_ai_default, boog_ai_status, boog_ai_model_type } = proxy.useDict('boog_ai_model_tag', 'boog_ai_default', 'boog_ai_status', 'boog_ai_model_type');

const modelList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const daterangeCreateTime = ref([]);
const daterangeUpdateTime = ref([]);

const openDrawer = ref(false);

const ollamaURLConfig = ref({});
const ollamaModels = ref([]);

const getConfig = () => {
  listConfig().then(res => {
    ollamaURLConfig.value = res.rows.find(item => item.configKey === 'ollamaUrl');
  });
}

getConfig();

const refreshUrl = () => {
  axios.get(ollamaURLConfig.value.configValue).then(res => {
    if (res.status === 200) {
      proxy.$modal.msgSuccess(res.data);
    } else {
      proxy.$modal.msgError(res.data);
    }
  }).catch(err => {
    proxy.$modal.msgError("请求失败");
  });
}

const updateUrl = () => {
  updateConfig(ollamaURLConfig.value).then(res => {
    if (res.code !== 200) {
      proxy.$modal.msgError(res.msg);
      return;
    }
    proxy.$modal.msgSuccess("修改成功");
    getConfig();
  });
}

const getOllamaModels = () => {
  axios.get(ollamaURLConfig.value.configValue + '/api/tags').then(res => {
    ollamaModels.value = res.data.models;
  }).catch(err => {
    proxy.$modal.msgError("请输入正确的URL");
  });
}

const formatModelSize = (row, column, cellValue) => {
  if (cellValue === null || cellValue === undefined) {
    return '';
  }
  const sizeInBytes = parseInt(cellValue);
  const sizeInGB = (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2);
  return `${sizeInGB} GB`;
};

const handleModelAdd = (model) => {
  const modelCode = model.model;
  const modelName = model.name;
  const modelVersion = model.version;
  const provider = 'ollama';
  const apiEndpoint = ollamaURLConfig.value.configValue;
  form.value = {
    modelCode,
    modelName,
    modelVersion,
    provider,
    apiEndpoint
  };
  open.value = true;
  title.value = "添加模型";
};

const modelTag = ref("");
const showProgress = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref("");
const progressText = ref("");
const layerProgress = ref({}); // Track progress of multiple layers
const progressIndeterminate = ref(false);
const isDownloading = ref(false);

const calculateOverallProgress = () => {
  // Calculate overall progress across all layers
  const layers = Object.values(layerProgress.value);
  if (layers.length === 0) return 0;

  let totalBytes = 0;
  let completedBytes = 0;

  layers.forEach(layer => {
    totalBytes += layer.total || 0;
    completedBytes += layer.completed || 0;
  });

  if (totalBytes === 0) return 5; // Initial progress

  // Scale to 5-95% range for downloading phase
  const downloadPercentage = (completedBytes / totalBytes) * 90 + 5;
  return Math.min(Math.floor(downloadPercentage), 95);
};

const pullOllamaModel = () => {
  if (!modelTag.value) {
    proxy.$modal.msgError("请输入模型标签");
    return;
  }

  // 强制设置进度条可见，确保UI更新
  showProgress.value = true;
  progressPercentage.value = 1; // 从1%开始，确保有可见变化
  progressStatus.value = "";
  progressText.value = "正在准备下载...";
  layerProgress.value = {};
  isDownloading.value = false;


  // 使用XMLHttpRequest来手动处理流式响应
  const xhr = new XMLHttpRequest();
  let buffer = "";

  xhr.open('POST', `${ollamaURLConfig.value.configValue}/api/pull`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  // 确保响应立即可见
  xhr.onreadystatechange = function () {
    if (xhr.readyState > 1) { // OPENED状态之后
      // 强制确保进度条显示
      showProgress.value = true;
    }
  };

  xhr.onprogress = function () {
    // 再次确保进度条显示
    if (!showProgress.value) {
      showProgress.value = true;
    }


    // 获取新的响应文本
    const newResponseText = xhr.responseText;
    // 找出新添加的部分
    const newText = newResponseText.substring(buffer.length);
    buffer = newResponseText;

    // 处理新添加的文本行
    const lines = newText.split('\n');

    lines.forEach(line => {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);

          // 更新进度条UI
          handleStatusUpdate(data);
        } catch (e) {
          // 可能是部分JSON，忽略错误
        }
      }
    });
  };

  // 处理完成事件
  xhr.onload = function () {
    if (xhr.status === 200) {
      // 最后检查是否有未处理的行
      const lines = buffer.split('\n');
      let foundSuccess = false;

      lines.forEach(line => {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.status === "success") {
              foundSuccess = true;
              handleStatusUpdate(data);
            }
          } catch (e) {

          }
        }
      });

      if (!foundSuccess) {
        // 如果未找到成功状态，但请求已完成，可能是提前结束
        progressText.value = "下载完成";
        progressPercentage.value = 100;
        progressStatus.value = "success";
        progressIndeterminate.value = false;
        isDownloading.value = false;

        setTimeout(() => {
          showProgress.value = false;
          activeCollapses.value = []; // 关闭折叠面板
          proxy.$modal.msgSuccess("模型下载成功");
          getOllamaModels(); // 刷新模型列表
        }, 2000);
      }
    } else {

      showProgress.value = false;
      proxy.$modal.msgError(`请求失败: ${xhr.statusText}`);
    }
  };

  // 处理错误
  xhr.onerror = function () {

    showProgress.value = false;
    proxy.$modal.msgError("网络错误，请检查连接");
  };

  // 发送请求
  xhr.send(JSON.stringify({
    name: modelTag.value,
    stream: true
  }));
};

// 处理不同状态的更新
const handleStatusUpdate = (data) => {


  if (data.status === "pulling manifest") {
    progressText.value = "正在获取模型信息...";
    progressPercentage.value = 5;
    progressIndeterminate.value = true;
    isDownloading.value = false;
  }
  else if (data.status && data.status.startsWith("pulling")) {
    progressIndeterminate.value = false;
    isDownloading.value = true;
    // 更新特定层的进度
    if (data.digest) {
      layerProgress.value[data.digest] = {
        total: data.total || 0,
        completed: data.completed || 0
      };

      // 计算并更新总体进度
      progressPercentage.value = calculateOverallProgress();

      // 获取所有层的总大小和已完成大小
      const totalSum = Object.values(layerProgress.value).reduce((sum, layer) => sum + (layer.total || 0), 0);
      const completedSum = Object.values(layerProgress.value).reduce((sum, layer) => sum + (layer.completed || 0), 0);

      // 格式化显示大小
      if (totalSum > 0) {
        const totalGB = (totalSum / (1024 * 1024 * 1024)).toFixed(2);
        const completedGB = (completedSum / (1024 * 1024 * 1024)).toFixed(2);
        progressText.value = `下载中: ${completedGB}/${totalGB} GB (${Object.keys(layerProgress.value).length} 层)`;
      }
    }
  }
  else if (data.status === "verifying sha256 digest") {
    progressText.value = "正在验证文件完整性...";
    progressPercentage.value = 96;
    progressIndeterminate.value = true;
    isDownloading.value = false;
  }
  else if (data.status === "writing manifest") {
    progressText.value = "正在写入模型信息...";
    progressPercentage.value = 98;
    progressIndeterminate.value = true;
    isDownloading.value = false;
  }
  else if (data.status === "removing any unused layers") {
    progressText.value = "正在清理临时文件...";
    progressPercentage.value = 99;
    progressIndeterminate.value = true;
    isDownloading.value = false;
  }
  else if (data.status === "success") {
    progressText.value = "下载完成";
    progressPercentage.value = 100;
    progressStatus.value = "success";
    progressIndeterminate.value = false;
    isDownloading.value = false;

    // 延迟隐藏进度条，确保用户能看到完成状态
    setTimeout(() => {
      showProgress.value = false;
      activeCollapses.value = []; // 关闭折叠面板
      proxy.$modal.msgSuccess("模型下载成功");
      getOllamaModels(); // 刷新模型列表
    }, 2000);
  }
};

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    modelCode: null,
    modelName: null,
    provider: null,
    modelType: null,
    tag: null,
    status: null,
    isDefault: null,
    createTime: null,
  },
  rules: {
    modelCode: [
      { required: true, message: "模型代码不能为空", trigger: "blur" }
    ],
    modelName: [
      { required: true, message: "模型名称不能为空", trigger: "blur" }
    ],
    modelVersion: [
      { required: true, message: "模型版本不能为空", trigger: "blur" }
    ],
    provider: [
      { required: true, message: "提供方不能为空", trigger: "blur" }
    ],
    modelType: [
      { required: true, message: "模型类型不能为空", trigger: "change" }
    ],
    apiEndpoint: [
      { required: true, message: "调用地址不能为空", trigger: "blur" }
    ],
    tag: [
      { required: true, message: "模型特点不能为空", trigger: "change" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询模型列表 */
function getList() {
  loading.value = true;
  queryParams.value.params = {};
  if (null != daterangeCreateTime && '' != daterangeCreateTime) {
    queryParams.value.params["beginCreateTime"] = daterangeCreateTime.value[0];
    queryParams.value.params["endCreateTime"] = daterangeCreateTime.value[1];
  }
  if (null != daterangeUpdateTime && '' != daterangeUpdateTime) {
    queryParams.value.params["beginUpdateTime"] = daterangeUpdateTime.value[0];
    queryParams.value.params["endUpdateTime"] = daterangeUpdateTime.value[1];
  }
  listModel(queryParams.value).then(response => {
    modelList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    modelId: null,
    modelCode: null,
    modelName: null,
    modelVersion: null,
    provider: null,
    modelType: null,
    description: null,
    apiEndpoint: null,
    tag: null,
    status: null,
    isDefault: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("modelRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  daterangeCreateTime.value = [];
  daterangeUpdateTime.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.modelId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加模型";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _modelId = row.modelId || ids.value
  getModel(_modelId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改模型";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["modelRef"].validate(valid => {
    if (valid) {
      if (form.value.modelId != null) {
        updateModel(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addModel(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _modelIds = row.modelId || ids.value;
  proxy.$modal.confirm('是否确认删除模型编号为"' + _modelIds + '"的数据项？').then(function () {
    return delModel(_modelIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('server/model/export', {
    ...queryParams.value
  }, `model_${new Date().getTime()}.xlsx`)
}


// 折叠面板激活项
const activeCollapses = ref(['progress']);

// 格式化总下载大小
const formatTotalSize = () => {
  const totalSum = Object.values(layerProgress.value).reduce((sum, layer) => sum + (layer.total || 0), 0);
  const completedSum = Object.values(layerProgress.value).reduce((sum, layer) => sum + (layer.completed || 0), 0);

  if (totalSum > 0) {
    const totalGB = (totalSum / (1024 * 1024 * 1024)).toFixed(2);
    const completedGB = (completedSum / (1024 * 1024 * 1024)).toFixed(2);
    return `${completedGB}/${totalGB} GB`;
  }
  return '计算中...';
};

// 获取状态样式类
const getStatusClass = () => {
  if (progressStatus.value === 'success') {
    return 'status-success';
  } else if (progressStatus.value === 'exception') {
    return 'status-error';
  } else if (isDownloading.value) {
    return 'status-downloading';
  } else {
    return 'status-processing';
  }
};

// 删除Ollama模型
const deleteOllamaModel = (modelName) => {
  proxy.$modal.confirm(`确定要删除本地模型 "${modelName}" 吗？此操作将删除所有相关数据。`).then(() => {
    // 显示加载状态
    showProgress.value = true;
    progressText.value = `正在删除模型 ${modelName}...`;
    progressPercentage.value = 50;
    progressIndeterminate.value = true;
    progressStatus.value = "";

    // 发送删除请求
    axios.delete(`${ollamaURLConfig.value.configValue}/api/delete`, {
      data: {
        name: modelName
      }
    })
      .then(response => {
        if (response.status === 200) {
          // 删除成功
          progressText.value = `模型 ${modelName} 已删除`;
          progressPercentage.value = 100;
          progressStatus.value = "success";
          progressIndeterminate.value = false;

          setTimeout(() => {
            showProgress.value = false;
            proxy.$modal.msgSuccess(`模型 ${modelName} 已成功删除`);
            getOllamaModels(); // 刷新模型列表
          }, 1500);
        } else {
          throw new Error(`响应状态码: ${response.status}`);
        }
      })
      .catch(err => {
        progressText.value = `删除失败: ${err.message}`;
        progressPercentage.value = 0;
        progressStatus.value = "exception";
        progressIndeterminate.value = false;

        setTimeout(() => {
          showProgress.value = false;
          proxy.$modal.msgError(`删除失败: ${err.message}`);
        }, 1500);
      });
  }).catch(() => {
    // 取消删除操作
  });
};

getList();
</script>

<style scoped>
.progress-container {
  margin: 15px 0;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
  transition: all 0.3s;
}

.progress-container:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.debug-info {
  margin: 10px 0;
  padding: 8px;
  color: #606266;
  font-size: 12px;
  background-color: #f0f9eb;
  border-radius: 4px;
  border-left: 3px solid #67c23a;
}

/* 自定义进度条样式 */
.custom-progress-container {
  margin: 15px 0;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.progress-percentage {
  font-size: 14px;
  color: #606266;
  font-weight: bold;
}

.progress-bar-container {
  height: 20px;
  background-color: #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background-color: #409EFF;
  transition: width 0.3s ease;
  border-radius: 10px;
}

.progress-bar-striped {
  background-image: linear-gradient(45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent);
  background-size: 20px 20px;
}

.progress-bar-animated {
  animation: progress-bar-stripes 2s linear infinite;
}

.progress-indeterminate {
  width: 50% !important;
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes progress-bar-stripes {
  from {
    background-position: 40px 0;
  }

  to {
    background-position: 0 0;
  }
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(200%);
  }
}

.progress-details {
  display: flex;
  justify-content: space-between;
  color: #606266;
  font-size: 12px;
}

.progress-detail-item {
  display: flex;
  align-items: center;
}

.progress-detail-item i {
  margin-right: 5px;
}

.progress-status {
  margin-left: 5px;
}

.progress-collapse {
  width: 100%;
  margin: 15px 0;
}

.progress-text-container {
  padding: 8px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.progress-text-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
  min-width: 150px;
}

.progress-label {
  color: #606266;
  margin-right: 8px;
  font-weight: bold;
  min-width: 70px;
}

.progress-value {
  color: #303133;
}

.progress-text-empty {
  color: #909399;
  padding: 10px 0;
  text-align: center;
  font-style: italic;
}

.status-success {
  color: #67C23A;
  font-weight: bold;
}

.status-error {
  color: #F56C6C;
  font-weight: bold;
}

.status-downloading {
  color: #409EFF;
  font-weight: bold;
}

.status-processing {
  color: #E6A23C;
  font-weight: bold;
}
</style>
