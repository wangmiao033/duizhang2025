import React, { useState } from 'react'
import './UserGuide.css'

function UserGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('getting-started')

  const sections = {
    'getting-started': {
      title: '快速开始',
      content: (
        <div>
          <h4>1. 设置结算月份</h4>
          <p>在页面顶部输入结算月份，例如：2025年9月</p>
          
          <h4>2. 配置公司信息</h4>
          <p>在公司信息配置区域填写甲方和乙方的详细信息</p>
          
          <h4>3. 添加对账记录</h4>
          <p>在左侧表单中填写对账记录，系统会自动计算结算金额</p>
          
          <h4>4. 导出对账单</h4>
          <p>点击底部的"导出对账单"按钮，生成Excel格式的对账单</p>
        </div>
      )
    },
    'features': {
      title: '功能说明',
      content: (
        <div>
          <h4>数据管理</h4>
          <ul>
            <li><strong>添加记录：</strong>填写表单添加新的对账记录</li>
            <li><strong>编辑记录：</strong>点击表格中的"编辑"按钮修改记录</li>
            <li><strong>删除记录：</strong>点击"删除"按钮，需要确认操作</li>
            <li><strong>复制记录：</strong>点击"复制"按钮快速创建相似记录</li>
          </ul>
          
          <h4>批量操作</h4>
          <ul>
            <li><strong>批量选择：</strong>使用表格左侧的复选框选择多条记录</li>
            <li><strong>批量删除：</strong>选择多条记录后点击"批量删除"</li>
            <li><strong>批量编辑：</strong>选择多条记录后点击"批量编辑"修改字段</li>
          </ul>
          
          <h4>数据筛选</h4>
          <ul>
            <li><strong>搜索：</strong>在搜索框输入关键词快速查找</li>
            <li><strong>筛选：</strong>点击"筛选和排序"设置筛选条件</li>
            <li><strong>排序：</strong>点击排序按钮按不同字段排序</li>
          </ul>
        </div>
      )
    },
    'templates': {
      title: '模板使用',
      content: (
        <div>
          <h4>使用模板预设</h4>
          <ol>
            <li>点击表单区域的"模板预设"按钮</li>
            <li>选择已有的模板（如：标准模板、高分成模板）</li>
            <li>点击"应用"按钮，模板参数会自动填充到表单</li>
          </ol>
          
          <h4>创建自定义模板</h4>
          <ol>
            <li>在模板预设对话框中填写模板名称</li>
            <li>设置通道费率、税点、分成比例、折扣等参数</li>
            <li>点击"保存模板"按钮</li>
            <li>之后可以在模板列表中找到并使用</li>
          </ol>
          
          <h4>保存账单</h4>
          <ol>
            <li>点击"保存当前账单"按钮</li>
            <li>输入账单名称（如：2025年9月对账单）</li>
            <li>系统会保存当前所有数据</li>
            <li>之后可以在账单管理中加载已保存的账单</li>
          </ol>
        </div>
      )
    },
    'export': {
      title: '导出功能',
      content: (
        <div>
          <h4>Excel导出</h4>
          <ul>
            <li>点击"导出对账单"按钮生成Excel文件</li>
            <li>文件包含完整的数据表格、公司信息和备注</li>
            <li>文件名包含时间戳，方便管理</li>
          </ul>
          
          <h4>CSV导出</h4>
          <ul>
            <li>点击"导出CSV"按钮生成CSV文件</li>
            <li>可以用Excel或其他表格软件打开</li>
            <li>适合数据分析和处理</li>
          </ul>
          
          <h4>打印功能</h4>
          <ul>
            <li>点击"打印对账单"按钮</li>
            <li>系统会打开打印预览窗口</li>
            <li>可以调整打印设置后打印</li>
          </ul>
          
          <h4>数据备份</h4>
          <ul>
            <li>点击"导出备份"保存所有数据为JSON文件</li>
            <li>点击"导入备份"可以恢复之前的数据</li>
            <li>建议定期备份重要数据</li>
          </ul>
        </div>
      )
    },
    'shortcuts': {
      title: '快捷键',
      content: (
        <div>
          <h4>常用快捷键</h4>
          <ul>
            <li><kbd>Ctrl</kbd> + <kbd>F</kbd> - 聚焦搜索框</li>
            <li><kbd>Ctrl</kbd> + <kbd>P</kbd> - 打印对账单</li>
            <li><kbd>Enter</kbd> - 提交表单（在表单中）</li>
            <li><kbd>Esc</kbd> - 关闭对话框/取消编辑</li>
          </ul>
        </div>
      )
    },
    'tips': {
      title: '使用技巧',
      content: (
        <div>
          <h4>提高效率</h4>
          <ul>
            <li>使用模板预设快速设置常用参数</li>
            <li>使用复制功能快速创建相似记录</li>
            <li>使用批量编辑同时修改多条记录</li>
            <li>保存常用账单模板，方便重复使用</li>
          </ul>
          
          <h4>数据管理</h4>
          <ul>
            <li>定期使用数据备份功能保存数据</li>
            <li>使用搜索和筛选快速找到需要的记录</li>
            <li>查看数据校验结果，及时修复错误</li>
            <li>使用统计报表了解数据概况</li>
          </ul>
          
          <h4>注意事项</h4>
          <ul>
            <li>结算金额会根据公式自动计算</li>
            <li>数据会自动保存到浏览器本地存储</li>
            <li>清除浏览器数据会丢失本地存储的数据</li>
            <li>建议定期导出备份文件</li>
          </ul>
        </div>
      )
    }
  }

  return (
    <>
      <button 
        className="guide-btn"
        onClick={() => setIsOpen(true)}
        title="使用指南"
      >
        📖 使用指南
      </button>

      {isOpen && (
        <div className="guide-overlay" onClick={() => setIsOpen(false)}>
          <div className="guide-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="guide-header">
              <h3>使用指南</h3>
              <button className="close-guide-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="guide-content">
              <div className="guide-sidebar">
                {Object.entries(sections).map(([key, section]) => (
                  <button
                    key={key}
                    className={`guide-nav-btn ${activeSection === key ? 'active' : ''}`}
                    onClick={() => setActiveSection(key)}
                  >
                    {section.title}
                  </button>
                ))}
              </div>

              <div className="guide-main">
                <h2>{sections[activeSection].title}</h2>
                <div className="guide-text">
                  {sections[activeSection].content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserGuide

