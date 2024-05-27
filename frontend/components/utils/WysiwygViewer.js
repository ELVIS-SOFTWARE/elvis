import React from 'react'
import draftToHtml from 'draftjs-to-html';
import DOMPurify from 'isomorphic-dompurify';
import { ContentState, convertFromRaw, convertToRaw, EditorState } from "draft-js";

/**
 * Display a WYSIWYG content in HTML format converted from a JSON string. HTML is sanitized.
 * @param {string} wysiwygStrData
 * @param {string} className
 * @param {React.CSSProperties} style
 * @returns {JSX.Element}
 */
export default function WysiwygViewer({wysiwygStrData, className, style})
{
    let savedContentState;

    try
    {
        const savedContentRaw = JSON.parse(wysiwygStrData);
        savedContentState = convertFromRaw(savedContentRaw);
    }
    catch (e)
    {
        savedContentState = ContentState.createFromText(wysiwygStrData);
    }

    const editorState = EditorState.createWithContent(savedContentState);

    // ne pas mettre la configuration de sanitize en props, ce serait une faille de sécurité
    const wysiwygContent = DOMPurify.sanitize(draftToHtml(convertToRaw(editorState.getCurrentContent())), {
        ADD_ATTR: ['target'],
    })

    return (
        <div
            className={className}
            style={style}
            dangerouslySetInnerHTML={{__html: wysiwygContent}}>
        </div>
    )
}