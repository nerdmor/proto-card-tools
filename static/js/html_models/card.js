cardOuterHtmlModel = `<div class="card mtgcard-outer" card_key="{{card_key}}" id="card_{{card_key}}">
{{innerHTML}}
</div>
`;

cardHeaderHtmlModel = `<div class="card-header mtgcard-header">
    <button class="btn btn-warning">🛎️</button>
</div>
`;

cardBodyHtmlModel = `<div class="card-body mtgcard-body" style="background-image: url('{{image_url}}');">
    <div class="mtgcard-icon-wrapper">
        <p class="mtgcard-icon-p">{{card_icon}}</p>
    </div>
</div>`;
