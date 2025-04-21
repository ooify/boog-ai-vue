import request from '@/utils/request'

// 查询密钥列表
export function listSecret(query) {
  return request({
    url: '/server/secret/list',
    method: 'get',
    params: query
  })
}

// 查询密钥详细
export function getSecret(keyId) {
  return request({
    url: '/server/secret/' + keyId,
    method: 'get'
  })
}

// 新增密钥
export function addSecret(data) {
  return request({
    url: '/server/secret',
    method: 'post',
    data: data
  })
}

// 修改密钥
export function updateSecret(data) {
  return request({
    url: '/server/secret',
    method: 'put',
    data: data
  })
}

// 删除密钥
export function delSecret(keyId) {
  return request({
    url: '/server/secret/' + keyId,
    method: 'delete'
  })
}
