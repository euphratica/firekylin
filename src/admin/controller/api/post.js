'use strict';

import Base from './base.js';
import marked from "marked";
import markToc from "marked-toc";
import highlight from 'highlight.js';

export default class extends Base {
  modelInstance = this.modelInstance.where({type: '0'});
  /**
   * get
   * @return {[type]} [description]
   */
  async getAction(self){
    // this.modelInstance.field('id,user_id,type,status,title,pathname,create_time,update_time');
    console.log(this.id)
    let data;
    if( this.id ) {
      if( this.id === 'lastest' ) return this.lastest();
      data = await this.modelInstance.where({_id: this.id}).select();
      //console.log(data);
    } else {
      let where = {};
      //不是管理员，只显示个人的文章
      if(this.userInfo.type !== 1){
        where.user_id = this.userInfo.id;
      }
      data =  await this.modelInstance.where(where).order('id DESC').page( this.get('page'), 15 ).countSelect();
      //await this.modelInstance.page(1, 5).countSelect();
      //data = await this.modelInstance.page(1, 5).countSelect();
     // console.log(data);
      //console.log(await this.modelInstance.where(where).order('id DESC').page( this.get('page'), 15 ).countSelect());
    }
   // console.log(data)
    return this.success(data);
  }

  getBaseAction(self) {
    return super.getAction(self);
  }
  /**
   * add user
   * @return {[type]} [description]
   */
  async postAction(){
    let data = this.post();
    //check pathname
    let post = await this.modelInstance.where({pathname: data.pathname}).select();
    if( post.length > 0 ) {
      return this.fail('PATHNAME_EXIST');
    }

    data.user_id = this.userInfo.id;
    data = this.getContentAndSummary(data);
    data = this.getPostTime(data);
    data.tag = await this.getTagNames(data.tag);
    data.cate= await this.getCateIds(data.cate);
    /** 如果是编辑发布文章的话默认状态改为审核中 **/
    if( data.status == 3 && this.userInfo.type == 2 ) {
      data.status = 1;
    }

    let insertId = await this.modelInstance.addPost(data);
    return this.success({id: insertId});
  }
  /**
   * update user info
   * @return {[type]} [description]
   */
  async putAction(){
    if (!this.id) {
      return this.fail('PARAMS_ERROR');
    }
    let data = this.post();
    data.id = this.id;
    data = this.getContentAndSummary(data);
    data = this.getPostTime(data);
    data.tag = await this.getTagNames(data.tag);

    let rows = await this.modelInstance.savePost(data);
    return this.success({affectedRows: rows});
  }

  async lastest() {
    let data = await this.modelInstance.getLatest(6);
    return this.success(data);
  }

  getPostTime(data) {
    data.update_time = think.datetime();
    /**草稿可以没有创建时间**/
    if( !data.create_time ) {
      data.create_time = data.status != 0 ? data.update_time : null;
    }else{
      data.create_time = think.datetime(data.create_time);
    }
    return data;
  }

  getContentAndSummary(data) {
    data.content = this.markdownToHtml(data.markdown_content);
    data.summary = data.content.split('<!--more-->')[0].replace(/<[>]*>/g, '');
    return data;
  }

  async getTagNames(tags) {
    if(!tags){
      return [];
    }
    if(!think.isArray(tags)){
      tags = [tags];
    }
    let modelInstance = this.model('tag'), tagNames = [];
    let promises = tags.map(name =>
      modelInstance.where({name}).thenAdd({name, pathname: encodeURIComponent(name)}).then(data => tagNames.push({name: name}))
    );
    await Promise.all(promises);
    return tagNames;
  }
   async getCateIds(cates){
     if(!cates){
       return [];
     }
     if(!think.isArray(cates)){
       cates = [cates];
     }
     let modelInstance = this.model('cate'), cateIds = [];
     let promises= cates.map( name =>
         modelInstance.where({name}).thenAdd({name, pathname: encodeURIComponent(name)}).then(data => tagNames.push({name: name})))
     await Promise.all(promises);
     return cateIds;
   }
  /**
   * generate toc name
   * @param  {String} name []
   * @return {String}      []
   */
  generateTocName(name){
    name = name.trim().replace(/\s+/g, '').replace(/\)/g, '').replace(/[\(\,]/g, '-').toLowerCase();
    if(/^[\w\-]+$/.test(name)){
      return name;
    }
    return `toc-${think.md5(name).slice(0, 3)}`;
  }
  /**
   * markdown to html
   * @return {} []
   */
  markdownToHtml(content){
    let tocContent = marked(markToc(content)).replace(/<a\s+href="#([^\"]+)">([^<>]+)<\/a>/g, (a, b, c) => {
      return `<a href="#${this.generateTocName(c)}">${c}</a>`;
    });

    let markedContent = marked(content).replace(/<h(\d)[^<>]*>(.*?)<\/h\1>/g, (a, b, c) => {
      if(b == 2){
        return `<h${b} id="${this.generateTocName(c)}">${c}</h${b}>`;
      }
      return `<h${b} id="${this.generateTocName(c)}"><a class="anchor" href="#${this.generateTocName(c)}"></a>${c}</h${b}>`;
    });
    // markedContent = markedContent.replace(/<h(\d)[^<>]*>([^<>]+)<\/h\1>/, (a, b, c) => {
    //   return `${a}<div class="toc">${tocContent}</div>`;
    // });

    let highlightContent = markedContent.replace(/<pre><code\s*(?:class="lang-(\w+)")?>([\s\S]+?)<\/code><\/pre>/mg, (a, language, text) => {
      text = text.replace(/&#39;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/\&quot;/g, '"').replace(/\&amp;/g, "&");
      var result = highlight.highlightAuto(text, language ? [language] : undefined);
      return `<pre><code class="hljs lang-${result.language}">${result.value}</code></pre>`;
    });

    return highlightContent;
  }
}
